package edu.uiu.aoop.careerforge.service;

import edu.uiu.aoop.careerforge.dto.AdminCommunityPostResponse;
import edu.uiu.aoop.careerforge.dto.PostRequest;
import edu.uiu.aoop.careerforge.model.CommunityPost;
import edu.uiu.aoop.careerforge.repository.CommunityCommentRepository;
import edu.uiu.aoop.careerforge.repository.CommunityPostRepository;
import edu.uiu.aoop.careerforge.repository.PostLikeStore;
import edu.uiu.aoop.careerforge.repository.ContentReportStore;
import edu.uiu.aoop.careerforge.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class AdminCommunityService {
    private final AccessService access; private final CommunityPostRepository posts; private final CommunityCommentRepository comments;
    private final PostLikeStore likes; private final ContentReportStore reports; private final UserRepository users; private final CommunityModerationService moderation;

    public AdminCommunityService(AccessService access, CommunityPostRepository posts, CommunityCommentRepository comments,
                                 PostLikeStore likes, ContentReportStore reports, UserRepository users, CommunityModerationService moderation) {
        this.access = access; this.posts = posts; this.comments = comments; this.likes = likes; this.reports = reports; this.users = users; this.moderation = moderation;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> overview(Long adminId) {
        access.requireAdmin(adminId);
        return Map.of("visiblePosts", posts.countByStatus("visible"), "pendingPosts", posts.countByStatus("pending_review"),
                "removedPosts", posts.countByStatus("removed"), "openReports", reports.openTotal());
    }

    @Transactional(readOnly = true)
    public List<AdminCommunityPostResponse> posts(Long adminId) {
        access.requireAdmin(adminId);
        return posts.findAllByOrderByCreatedAtDescIdDesc().stream().map(this::postResponse).toList();
    }

    /** Administrators can publish official announcements without consuming student community points. */
    @Transactional
    public AdminCommunityPostResponse publish(Long adminId, PostRequest request) {
        access.requireAdmin(adminId);
        String content = clean(request.content(), 5000);
        CommunityModerationService.Result result = moderation.analyse(content, posts.findByUserIdAndCreatedAtAfter(adminId, java.time.LocalDateTime.now().minusHours(24)));
        CommunityPost post = new CommunityPost(adminId, content, optional(request.mediaUrl()), optional(request.topicTags()),
                result.spamScore(), result.fraudScore(), result.riskScore(), result.riskLabel(), result.reasons(), "visible");
        return postResponse(posts.save(post));
    }

    @Transactional
    public AdminCommunityPostResponse updatePostStatus(Long adminId, Long postId, String status) {
        access.requireAdmin(adminId);
        if (!"visible".equals(status) && !"removed".equals(status)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post status must be visible or removed.");
        CommunityPost post = posts.findById(postId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found."));
        post.moderate(status);
        reports.resolveForPost(postId, adminId, "visible".equals(status) ? "dismissed" : "removed");
        return postResponse(post);
    }

    @Transactional
    public AdminCommunityPostResponse rescan(Long adminId, Long postId) {
        access.requireAdmin(adminId);
        CommunityPost post = posts.findById(postId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found."));
        List<CommunityPost> recentPosts = posts.findByUserIdAndCreatedAtAfter(post.getUserId(), java.time.LocalDateTime.now().minusHours(24)).stream()
                .filter(candidate -> !postId.equals(candidate.getId())).toList();
        CommunityModerationService.Result result = moderation.analyse(post.getContent(), recentPosts);
        post.applyModeration(result.spamScore(), result.fraudScore(), result.riskScore(), result.riskLabel(), result.reasons(), result.status());
        return postResponse(post);
    }

    private AdminCommunityPostResponse postResponse(CommunityPost post) {
        String author = users.findById(post.getUserId()).map(user -> user.getName()).orElse("Former student");
        return new AdminCommunityPostResponse(post.getId(), author, post.getContent(), post.getStatus(), post.getSpamScore(),
                post.getFraudScore(), post.getRiskScore(), post.getRiskLabel(), post.getRiskReasons(), reports.openCount(post.getId()),
                likes.countForPost(post.getId()), comments.countByPostIdAndStatus(post.getId(), "visible"), post.getCreatedAt());
    }
    private String clean(String value, int maximum) {
        String content = value == null ? "" : value.trim();
        if (content.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content cannot be empty.");
        if (content.length() > maximum) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content is too long.");
        return content;
    }
    private String optional(String value) { String content = value == null ? null : value.trim(); if (content != null && content.length() > 500) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Optional post information is too long."); return content == null || content.isBlank() ? null : content; }
}
