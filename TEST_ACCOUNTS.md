1# SkillBridge Africa — Test Accounts

> Created: 7 July 2026
> Supabase Project: `krihvhyexqstphxqkljr`
> **Note**: Accounts must be created via Supabase Auth admin API (requires `service_role` key).
> Contact the developer to run the seed script once the key is available.

---

## 1. Admin

| Field | Value |
|-------|-------|
| Email | `admin@skillbridge.africa` |
| Password | `Admin@123456` |
| Role | `student` *(acts as admin)* |
| Name | SkillBridge Admin |

---

## 2. Users (Students / Talent)

### User A — Sarah Johnson

| Field | Value |
|-------|-------|
| Email | `sarah.j@example.com` |
| Password | `User@123456` |
| Role | `student` |
| Name | Sarah Johnson |
| Headline | Full-Stack Developer |
| Skills | `React`, `TypeScript`, `Node.js`, `PostgreSQL`, `Python` |
| Bio | Passionate developer with 3 years of experience building web applications. |

### User B — David Okafor

| Field | Value |
|-------|-------|
| Email | `david.o@example.com` |
| Password | `User@123456` |
| Role | `student` |
| Name | David Okafor |
| Headline | UI/UX Designer & Frontend Developer |
| Skills | `Figma`, `React`, `Tailwind CSS`, `UI Design`, `Prototyping` |
| Bio | Creative designer turned developer, focused on building beautiful accessible interfaces. |

---

## 3. Organizations (Companies)

### Org A — TechVista Solutions

| Field | Value |
|-------|-------|
| Email | `hr@techvista.io` |
| Password | `Org@123456` |
| Role | `firm` |
| Name | TechVista HR |
| Company | TechVista Solutions |
| Headline | Building Africa's Next Tech Hub |
| Bio | TechVista is a Pan-African software development company with offices in Lagos, Nairobi, and Cape Town. |

### Org B — GreenField Innovations

| Field | Value |
|-------|-------|
| Email | `careers@greenfield.africa` |
| Password | `Org@123456` |
| Role | `firm` |
| Name | GreenField HR |
| Company | GreenField Innovations |
| Headline | Sustainable Tech for a Better Future |
| Bio | GreenField builds climate-tech solutions for African agriculture, energy, and logistics sectors. |

---

## Role-Based Access

| Route | Admin (`student`) | User (`student`) | Org (`firm`) |
|-------|-------------------|-------------------|--------------|
|-------|-------|----------------|----------------|
| `/` | ✅ | ✅ | ✅ |
| `/jobs` | ✅ | ✅ | ✅ |
| `/projects` | ✅ | ✅ | ✅ |
| `/talent` | ✅ | ✅ | ✅ |
| `/tutor` | ❌ | ✅ | ❌ |
| `/dashboard` | ❌ | ✅ | ❌ |
| `/dashboard/org` | ❌ | ❌ | ✅ |
| `/profile` | ✅ | ✅ | ✅ |
| `/my-applications` | ❌ | ✅ | ❌ |



Lets have a dashboard to cater for the firm and organisation that will be onboard on the platform, they will need premuim business function (B2B and B2A)to harness the best out of the platform and make good impact and profit out of the platform. you will act now as a analyzer, reseacher, product engineer and customer success persornal, imploy other agent where necessary and see how this feature will a success. create for plans, sprints, findings and prompts in the achieve folder to be refrenced during the mini project.


On the admin page lets be able to view users and their profiles too
And we should be able to add or delete service too
Lets also have AI power some aspects of the admin back, check for things AI should power and implement them