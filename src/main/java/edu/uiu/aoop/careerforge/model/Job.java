package edu.uiu.aoop.careerforge.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "jobs")
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_uuid", nullable = false, unique = true, updatable = false, length = 36)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID publicUuid;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "company_id", nullable = false)
    private Company company;
    @Column(name = "created_by") private Long createdBy;
    @Column(name = "source", length = 40) private String source;
    @Column(name = "external_id", length = 512) private String externalId;
    @Column(name = "source_url", length = 600) private String sourceUrl;
    private String title;
    @Column(length = 500) private String location;
    @Column(name = "employment_type") private String employmentType;
    @Column(name = "work_mode") private String workMode;
    @Column(name = "salary_text") private String salaryText;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(name = "expiry_date") private LocalDate expiryDate;
    @Column(name = "min_experience_years") private Integer minExperienceYears;
    @Column(name = "max_experience_years") private Integer maxExperienceYears;
    @Column(name = "source_published_at") private LocalDateTime sourcePublishedAt;
    @Column(name = "last_verified_at") private LocalDateTime lastVerifiedAt;
    @Column(name = "validation_status") private String validationStatus = "unknown";
    @Column(name = "normalized_role", length = 180) private String normalizedRole;
    @Column(name = "extracted_skills", columnDefinition = "TEXT") private String extractedSkills;
    @Column(name = "nlp_status", length = 30) private String nlpStatus = "pending";
    @Column(name = "nlp_confidence", precision = 5, scale = 2) private java.math.BigDecimal nlpConfidence;
    @Column(name = "nlp_processed_at") private LocalDateTime nlpProcessedAt;
    private String status;
    @Column(name = "created_at", insertable = false, updatable = false) private LocalDateTime createdAt;

    protected Job() { }
    @PrePersist
    void assignPublicUuid() { if (publicUuid == null) publicUuid = UUID.randomUUID(); }
    public Job(Company company, Long createdBy) { this.company = company; this.createdBy = createdBy; }
    public Long getId() { return id; }
    public UUID getPublicUuid() { return publicUuid; }
    public Company getCompany() { return company; }
    public Long getCreatedBy() { return createdBy; }
    public String getSource() { return source; }
    public String getExternalId() { return externalId; }
    public String getSourceUrl() { return sourceUrl; }
    public String getTitle() { return title; }
    public String getLocation() { return location; }
    public String getEmploymentType() { return employmentType; }
    public String getWorkMode() { return workMode; }
    public String getSalaryText() { return salaryText; }
    public String getDescription() { return description; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public Integer getMinExperienceYears() { return minExperienceYears; }
    public Integer getMaxExperienceYears() { return maxExperienceYears; }
    public LocalDateTime getSourcePublishedAt() { return sourcePublishedAt; }
    public LocalDateTime getLastVerifiedAt() { return lastVerifiedAt; }
    public String getValidationStatus() { return validationStatus; }
    public String getNormalizedRole() { return normalizedRole; }
    public String getExtractedSkills() { return extractedSkills; }
    public String getNlpStatus() { return nlpStatus; }
    public java.math.BigDecimal getNlpConfidence() { return nlpConfidence; }
    public LocalDateTime getNlpProcessedAt() { return nlpProcessedAt; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void update(String title, String location, String employmentType, String workMode, String salaryText, String description, LocalDate expiryDate, String status) {
        this.title = title; this.location = location; this.employmentType = employmentType; this.workMode = workMode;
        this.salaryText = salaryText; this.description = description; this.expiryDate = expiryDate; this.status = status;
    }
    public void markImported(String source, String externalId, String sourceUrl) {
        this.source = source; this.externalId = externalId; this.sourceUrl = sourceUrl;
    }
    public void setExperienceRange(Integer min, Integer max) { this.minExperienceYears = min; this.maxExperienceYears = max; }
    public void markVerified(LocalDateTime publishedAt, String validationStatus) { this.sourcePublishedAt = publishedAt; this.lastVerifiedAt = LocalDateTime.now(); this.validationStatus = validationStatus; }
    public void applyNlp(String normalizedRole, String extractedSkills, String nlpStatus, double confidence, LocalDateTime processedAt) {
        this.normalizedRole = normalizedRole;
        this.extractedSkills = extractedSkills;
        this.nlpStatus = nlpStatus;
        this.nlpConfidence = java.math.BigDecimal.valueOf(confidence).setScale(2, java.math.RoundingMode.HALF_UP);
        this.nlpProcessedAt = processedAt;
    }
}
