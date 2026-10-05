# CareerForge: Feature কীভাবে কাজ করে

> এই document-এ শুধু project-এর feature-গুলো user ব্যবহার করলে কীভাবে কাজ করে তা বলা হয়েছে। এটি report বা viva-তে সরাসরি ব্যবহার করা যাবে।

## 1. Registration এবং Login

### Student registration

1. Student name, email এবং password দিয়ে Register করে।
2. Frontend `POST /api/auth/register`-এ data পাঠায়।
3. Backend দেখে email আগে ব্যবহার হয়েছে কি না।
4. নতুন email হলে password BCrypt দিয়ে hash করা হয়; plain password database-এ রাখা হয় না।
5. `users` table-এ `student` role-এর নতুন account save হয়।
6. Backend user ID, name, email, role ও public UUID ফেরত দেয়।
7. Frontend basic session data localStorage-এ রেখে student workspace খুলে।

### Login

1. Student বা admin email, password এবং portal role দিয়ে login করে।
2. Backend email দিয়ে user খুঁজে BCrypt password match করে।
3. Account suspended হলে login বন্ধ করে দেয়।
4. Student account দিয়ে admin portal বা admin account দিয়ে student portal ব্যবহার করলে error দেয়।
5. Valid login হলে user role অনুযায়ী student অথবা admin dashboard খুলে।

## 2. Student Profile

Student profile-এ university, degree, graduation year, experience, target role, location, skills, hobbies, bio এবং photo রাখা যায়।

1. Profile page খুললে frontend `GET /api/profiles/{userId}` call করে।
2. Backend `student_profiles` table থেকে profile data পাঠায়।
3. Student Save করলে frontend `PUT /api/profiles/{userId}` call করে।
4. Backend দেখে logged-in student শুধু নিজের profile-ই update করছে।
5. Information `student_profiles` table-এ save/update হয়।
6. Photo upload হলে `POST /api/profiles/{userId}/photo` multipart request যায়।
7. Backend image validate করে safe upload location-এ রাখে এবং photo URL profile-এ save করে।

এই profile-এর target role, skill, experience এবং location পরে smart job match-এ ব্যবহার হয়।

## 3. Career Vault: CV এবং Document

### CV version

1. Student CV title ও content দিয়ে নতুন CV তৈরি করে।
2. Frontend `POST /api/vault/resumes` API call করে।
3. Backend `resume_versions` table-এ CV save করে।
4. Student একাধিক CV রাখতে পারে এবং একটি default CV select করতে পারে।
5. New default CV select হলে পুরোনো default CV automatically বাদ যায়।
6. CV edit, delete এবং default change করা যায়।

### Document upload

1. Student file select করে upload দেয়।
2. File `POST /api/vault/documents` multipart request হিসেবে যায়।
3. File-এর metadata/path `documents` table-এ save হয় এবং file `uploads/` location-এ থাকে।
4. Student নিজের document list, download ও delete করতে পারে।

### কেন CV snapshot রাখা হয়

Student job-এ apply করলে selected CV-এর snapshot application-এর সঙ্গে save হয়। পরে student CV edit করলেও পুরোনো application-এর CV evidence পরিবর্তন হয় না।

## 4. Admin Job Management

1. Admin company, job title, description, type, work mode, location, salary, expiry date এবং status দেয়।
2. Frontend `POST /api/admin/jobs` call করে।
3. Backend admin role verify করে।
4. Company আগে থাকলে সেটি reuse হয়; না থাকলে `companies` table-এ নতুন company তৈরি হয়।
5. Job `jobs` table-এ save হয়।
6. `JobNlpService` job text থেকে normalized role এবং extracted skills বের করে।
7. Gemini embedding configured থাকলে semantic vector background-এ queue হয়।
8. Job status `published` হলে student দেখতে পায়; `draft`/`closed` হলে দেখতে পায় না।

Admin job edit, delete, source sync এবং embedding status check করতে পারে। Scheduled task expiry date পার হওয়া job automatically `closed` করে।

## 5. Student Job Search এবং Smart Match

### Manual search

1. Student query, location, skill, work mode বা employment type দিয়ে search করে।
2. Frontend `GET /api/jobs/matches`-এ filter পাঠায়।
3. Backend শুধু published এবং non-expired job নেয়।
4. Title, company, location ও description-এর relevance অনুযায়ী result সাজায়।
5. Manual search-এর result profile দিয়ে change হয় না।

### Smart match

1. Student কোনো search filter ছাড়া jobs page খুললে backend profile ও default CV নেয়।
2. প্রতিটি published job-এর সঙ্গে profile/CV compare হয়।
3. Target role বা required experience incompatible হলে job recommendation থেকে বাদ যায়।
4. Compatible job match percentage, matching skill এবং explanation-সহ দেখায়।

### Match score

| Factor | সর্বোচ্চ score | কী দেখে |
| --- | ---: | --- |
| Target role | 40 | Target role ও job title/description-এর term match |
| Experience | 25 | Profile experience ও job min/max range |
| Skills/CV/interests | 20 | Profile skill, CV ও interest term match |
| Location/work mode | 10 | Location preference বা remote support |
| Job freshness | 5 | Recently verified/created job |

Gemini key থাকলে profile ও job embedding তৈরি হয়। Vector ready হলে final ranking হয়:

```text
Final score = 40% rule-based score + 60% semantic similarity score
```

Gemini key না থাকলেও normal rule-based match কাজ করে।

## 6. Job Apply এবং Application Tracking

1. Student একটি published ও non-expired job select করে।
2. Student নিজের default বা selected CV দিয়ে Apply দেয়।
3. Frontend `POST /api/jobs/{jobId}/applications` call করে।
4. Backend নিশ্চিত করে student একই job-এ আগে apply করেনি।
5. Selected CV-এর snapshot তৈরি হয়।
6. Job, profile ও CV compare করে match percentage এবং explanation তৈরি হয়।
7. `applications` table-এ application `submitted` status-এ save হয়।
8. Student নিজের Applications page-এ status ও match reason দেখতে পারে।

### Admin review

1. Admin সব application দেখতে পারে।
2. Admin status `submitted`, `under_review`, `shortlisted`, `rejected` অথবা `cancelled` করতে পারে।
3. Backend admin role verify করে নতুন status save করে।
4. Student নিজের application page reload করলে updated status দেখতে পায়।

## 7. AI Learning Path এবং Quiz

### Path create

1. Student topic দেয়, যেমন Java/React/Data Analyst, এবং path type দেয়: `skill` বা `job`।
2. Backend Gemini-এর কাছে suggested level count এবং reason চায়।
3. Gemini unavailable হলে local quick recommendation দেয়।
4. Student path create করলে topic, type ও level count `learning_paths` table-এ save হয়।
5. প্রতিটি level `learning_levels` table-এ থাকে।

### Quiz এবং progress

1. Student একটি unlocked level খুলে।
2. Question set না থাকলে backend Gemini দিয়ে quiz generate করে।
3. Gemini ব্যর্থ হলে Groq fallback চেষ্টা হয়।
4. Groq-ও ব্যর্থ হলে local fallback quiz তৈরি হয়।
5. Generated question set JSON হিসেবে level-এর সঙ্গে database-এ save হয়।
6. Student answer submit করলে result `learning_attempts` table-এ save হয়।
7. Score 70% বা বেশি হলে next level unlock হয়।

এখানে API unavailable হলেও fallback থাকার কারণে learning feature বন্ধ হয় না।

## 8. Learning Resource

1. Admin resource create/publish করে।
2. Student Resources page খুললে `GET /api/resources`-এ published resource আসে।
3. Response-এর সঙ্গে ওই student-এর saved/completed state আসে।
4. Save চাপলে `PUT /api/resources/{id}/saved` call হয়।
5. Complete চাপলে `PUT /api/resources/{id}/completed` call হয়।
6. Backend `resource_progress`-এ student-resource progress save/update করে।
7. Page reload-এর পরেও progress থাকে।

### Skill search ও YouTube

1. Student একটি skill দিয়ে resource search করে।
2. Backend local featured resource suggestion দেয়।
3. `YOUTUBE_API_KEY` থাকলে YouTube থেকে relevant public playlist search করে।
4. Key না থাকলে local resource চলে, কিন্তু live YouTube result আসে না।

## 9. Event

1. Admin event create, edit, delete বা publish করে।
2. Event data `events` table-এ থাকে।
3. Student page `GET /api/events` call করে।
4. Backend শুধু published event পাঠায়।

`event_registrations` table আছে, কিন্তু current code-এ full student event-registration API/UI পাওয়া যায়নি। এটি future feature হিসেবে বলা উচিত।

## 10. Community Feed

### Post create

1. Student post content, optional media URL এবং topic tag দেয়।
2. Frontend `POST /api/community/posts` call করে।
3. Backend student role, content length এবং community point check করে।
4. `CommunityModerationService` post text analyse করে।
5. Safe post `visible` status-এ save হয়। Risk থাকলে `pending_review` status-এ save হয়।
6. Post/comment করতে community wallet থেকে 1 point কমে।
7. Visible post feed-এ দেখা যায়।

### Like, comment, share, report

| Action | কী হয় |
| --- | --- |
| Like | একবার like করা যায়; আবার চাপলে unlike হয় |
| Comment | Comment `comments` table-এ save হয় এবং 1 point লাগে |
| Share | একই user একই post একবার share হিসেবে count করতে পারে |
| Report | নিজের post report করা যায় না; অন্য post valid reason দিয়ে report করা যায় |
| Delete own post/comment | Hard delete না করে `removed` status দিয়ে hide করা হয় |

### Community point system

- First use-এ student 10 point পায়।
- Post বা comment করলে 1 point খরচ হয়।
- দুই ঘণ্টা পর point আবার 10 হয়।
- Point শেষ হলে backend post/comment block করে।

## 11. Community Moderation

Post save হওয়ার আগে system নিচের বিষয়গুলো দেখে:

- Spam phrase: `buy now`, `limited offer`, `easy money`, `whatsapp`, `telegram` ইত্যাদি।
- Fraud phrase: `otp`, `password`, `pin`, `send money`, `bkash`, `nagad`, `registration fee` ইত্যাদি।
- গত 24 ঘণ্টার duplicate post।
- তিন বা তার বেশি link।
- Repeated character এবং অস্বাভাবিক বেশি capital letter।

| Condition | Result |
| --- | --- |
| Risk score 20-এর কম | `visible` |
| Risk score 20 বা বেশি | `pending_review` |
| Fraud score 38 বা বেশি | `fraud` label |
| Spam score 35 বা বেশি | `spam` label |

Admin moderation page থেকে post list দেখে status change এবং re-scan করতে পারে।

## 12. Student Connection

1. Student Connect page খুললে student directory আসে।
2. Name, university বা role দিয়ে search করা যায়।
3. একজন student অন্যজনকে connection request পাঠায়।
4. Backend self-connection ও duplicate pair আটকায়।
5. Request `student_connections` table-এ `pending` status-এ save হয়।
6. Recipient Accept করলে status `accepted` হয়।
7. তখনই দুইজনের private chat এবং connected profile দেখা unlock হয়।
8. Request cancel, decline বা connection remove করা যায়।

## 13. Real-time Private Chat

### Chat open

1. Chat page accepted connection list load করে।
2. Frontend `ws://localhost:4000/api/ws/chat?userId={studentId}` WebSocket connection খোলে।
3. Backend student verify করে এবং online presence update করে।
4. Connection list-এ online/offline, last active ও unread count দেখায়।

### Message send

1. Student accepted connection select করে message পাঠায়।
2. WebSocket open থাকলে connection ID ও message JSON packet হিসেবে যায়।
3. `ChatWebSocketHandler` background worker thread-এ packet process করে।
4. Backend নিশ্চিত করে sender accepted connection-এর participant।
5. Message `student_messages` table-এ save হয়।
6. Sender এবং receiver-এর open browser session-এ message instantly যায়।
7. Receiver conversation না খুলে থাকলে unread count বাড়ে।
8. WebSocket না থাকলে REST message endpoint fallback হিসেবে কাজ করে।

Pending connection থাকলে chat করা যায় না; connection-এর বাইরের কেউ message/profile access করতে পারে না।

## 14. Admin Dashboard এবং Student Management

1. Admin dashboard খুললে `GET /api/admin/overview` call হয়।
2. Backend student, job, application এবং content-এর count দেয়।
3. Admin student list খুলে user account active অথবা suspended করতে পারে।
4. Status update হলে `users.status` বদলায়।
5. Suspended user পরের login-এ blocked হয়।
6. Admin resource/event content create, update ও delete করতে পারে।
7. Published content student side-এ দেখা যায়।

## 15. External Job Sync

1. Admin একটি source অথবা সব available source sync দিতে পারে।
2. Backend admin role verify করে।
3. Source adapter external job data নেয়।
4. Source এবং external ID দিয়ে duplicate job আটকানো হয়।
5. Job/company data database-এ save হয়।
6. Sync tracker imported count, status এবং error রাখে।
7. Optional scheduler enable করলে fixed interval-এ automatic sync হয়; default-এ disabled।

| Source | কী করে |
| --- | --- |
| Remotive | Public remote job API থেকে limited import |
| Bdjobs | Configured source/API/HTML listing adapter দিয়ে import চেষ্টা |
| LinkedIn | Approved API/feed ছাড়া unauthorized scraping করে না |

## 16. Complete Student Journey

```text
Register/Login
      ↓
Complete Profile
      ↓
Create Default CV
      ↓
Open Smart Job Matches
      ↓
Apply with CV Snapshot
      ↓
Track Application Status
      ↓
Create Learning Path and Pass Levels
      ↓
Save/Complete Learning Resources
      ↓
Use Community, Build Connection and Chat
```

## 17. Viva-এর short answer

**Job match কীভাবে হয়?**

Profile target role, experience, skill, CV, location ও job freshness দিয়ে score হয়। Gemini embedding থাকলে semantic similarity যোগ হয়।

**AI service না চললে learning কীভাবে চলে?**

প্রথমে Gemini, পরে Groq, তারপর local fallback quiz ব্যবহার হয়।

**Chat real-time কেন?**

Message database-এ save হওয়ার পর accepted student-এর active WebSocket session-এ সঙ্গে সঙ্গে পাঠানো হয়।

**Community spam কীভাবে আটকানো হয়?**

Keyword, duplicate, link count, repeated character ও capital-letter rule দিয়ে risk score হয়; risky post admin review-তে যায়।

**পুরোনো application-এর CV কেন বদলায় না?**

Apply করার সময় CV snapshot application-এর সঙ্গে save হয়।
