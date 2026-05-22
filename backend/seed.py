"""Seed script — populates the PeerLift database with realistic sample data."""

import random
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.match import Match
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like
from app.models.notification import Notification
from app.models.message import Message


def seed():
    app = create_app()
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        # ── Skills (20) ──────────────────────────────────────────────
        skills_data = [
            ("React", "Programming"), ("Python", "Programming"), ("Java", "Programming"),
            ("Node.js", "Programming"), ("SQL", "Programming"), ("DSA", "Programming"),
            ("Machine Learning", "Programming"), ("Flutter", "Programming"),
            ("Figma", "Design"), ("UI Design", "Design"), ("Graphic Design", "Design"),
            ("Video Editing", "Design"),
            ("Guitar", "Music"), ("Singing", "Music"),
            ("Public Speaking", "Language"), ("English Writing", "Language"),
            ("Spanish", "Language"),
            ("Personal Finance", "Finance"), ("Excel", "Finance"),
            ("Basketball", "Sports"),
        ]
        skills = []
        for name, cat in skills_data:
            s = Skill(name=name, category=cat)
            db.session.add(s)
            skills.append(s)
        db.session.flush()
        print(f"  Seeded {len(skills)} skills.")

        # ── Users (15) ──────────────────────────────────────────────
        users_data = [
            # (name, username, email, college, degree, branch, year, bio, is_admin)
            ("Rudra Patel", "rudzzy", "rudra@pit.edu", "Parul University - PIT",
             "B.Tech", "Computer Science", 4,
             "Frontend student who loves clean dashboards and design critique.", True),
            ("Karan Vishwakarma", "karanv", "karan@piet.edu", "Parul University - PIET",
             "B.Tech", "Information Technology", 3,
             "Builds analytics projects and can help with practical ML basics.", False),
            ("Bharathraj M", "bharat", "bharath@parul.edu", "Parul University",
             "B.Tech", "Computer Science", 2,
             "Database enthusiast looking for a frontend accountability partner.", False),
            ("Thirandas Ganesh", "thirandas", "ganesh@parul.edu", "Parul University",
             "B.Tech", "Computer Science", 3,
             "Backend-focused builder, loves APIs and real-time systems.", False),
            ("Aarya Mehta", "aaryam", "aarya@iitb.edu", "IIT Bombay",
             "B.Tech", "Electrical Engineering", 2,
             "Exploring ML and want a React mentor for personal projects.", False),
            ("Priya Sharma", "priyash", "priya@bits.edu", "BITS Pilani",
             "M.Sc", "Data Science", 1,
             "Teaching Python and stats, learning UI/UX design.", False),
            ("Rohan Desai", "rohand", "rohan@vit.edu", "VIT Vellore",
             "B.Tech", "Mechanical Engineering", 3,
             "Self-taught coder, can teach Java and wants to learn Flutter.", False),
            ("Sneha Kulkarni", "snehak", "sneha@coep.edu", "COEP Pune",
             "B.Tech", "Computer Engineering", 4,
             "Full-stack dev with a passion for open source and DSA.", False),
            ("Arjun Nair", "arjunn", "arjun@nit.edu", "NIT Trichy",
             "B.Tech", "Electronics", 2,
             "Hardware student diving into software. Learning React.", False),
            ("Meera Iyer", "meerai", "meera@iisc.edu", "IISc Bangalore",
             "M.Tech", "AI & ML", 1,
             "Research student who can teach ML, wants public speaking practice.", False),
            ("Aditya Joshi", "adityaj", "aditya@dtu.edu", "DTU Delhi",
             "B.Tech", "Software Engineering", 3,
             "Building side projects in Node.js, open to design collabs.", False),
            ("Fatima Khan", "fatimak", "fatima@amu.edu", "AMU Aligarh",
             "B.A", "English Literature", 2,
             "Can teach English writing and wants to learn graphic design.", False),
            ("Vikram Singh", "vikrams", "vikram@iitd.edu", "IIT Delhi",
             "B.Tech", "Computer Science", 4,
             "Competitive programmer, happy to teach DSA for guitar lessons.", False),
            ("Lakshmi Reddy", "lakshmired", "lakshmi@osmania.edu", "Osmania University",
             "B.Com", "Finance", 3,
             "Excel wizard teaching personal finance, wants to learn Python.", False),
            ("Nikhil Gupta", "nikhilg", "nikhil@manipal.edu", "Manipal University",
             "B.Tech", "IT", 2,
             "Flutter developer looking for a SQL study buddy.", False),
        ]

        users = []
        for name, uname, email, college, deg, branch, year, bio, admin in users_data:
            u = User(
                name=name, username=uname, email=email, college=college,
                degree=deg, branch=branch, current_year=year, bio=bio,
                is_admin=admin,
            )
            u.set_password("password123")
            u.calculate_profile_completion()
            db.session.add(u)
            users.append(u)
        db.session.flush()
        print(f"  Seeded {len(users)} users (admin: {users[0].username}).")

        # ── User Skills ──────────────────────────────────────────────
        # (user_index, skill_index, type, level)
        assignments = [
            (0, 0, "teach", "advanced"), (0, 8, "teach", "intermediate"),
            (0, 1, "learn", "beginner"), (0, 6, "learn", "beginner"),
            (1, 1, "teach", "advanced"), (1, 7, "teach", "intermediate"), (1, 6, "teach", "intermediate"),
            (1, 14, "learn", "beginner"), (1, 9, "learn", "beginner"),
            (2, 4, "teach", "advanced"), (2, 4, "teach", "intermediate"),
            (2, 3, "learn", "beginner"), (2, 0, "learn", "beginner"),
            (3, 3, "teach", "advanced"), (3, 4, "teach", "intermediate"),
            (3, 9, "learn", "beginner"), (3, 8, "learn", "beginner"),
            (4, 6, "teach", "beginner"), (4, 0, "learn", "beginner"), (4, 10, "learn", "beginner"),
            (5, 1, "teach", "advanced"), (5, 18, "teach", "advanced"),
            (5, 9, "learn", "beginner"), (5, 8, "learn", "beginner"),
            (6, 2, "teach", "advanced"), (6, 7, "learn", "beginner"), (6, 10, "learn", "beginner"),
            (7, 5, "teach", "advanced"), (7, 0, "teach", "advanced"), (7, 3, "teach", "intermediate"),
            (7, 11, "learn", "beginner"),
            (8, 0, "learn", "beginner"), (8, 1, "learn", "beginner"),
            (9, 6, "teach", "advanced"), (9, 1, "teach", "advanced"),
            (9, 14, "learn", "intermediate"),
            (10, 3, "teach", "advanced"), (10, 8, "learn", "intermediate"), (10, 10, "learn", "beginner"),
            (11, 15, "teach", "advanced"), (11, 10, "learn", "beginner"),
            (12, 5, "teach", "advanced"), (12, 12, "learn", "intermediate"),
            (13, 18, "teach", "advanced"), (13, 17, "teach", "advanced"),
            (13, 1, "learn", "beginner"),
            (14, 7, "teach", "intermediate"), (14, 4, "learn", "beginner"),
        ]
        count = 0
        seen = set()
        for ui, si, stype, lvl in assignments:
            key = (users[ui].id, skills[si].id, stype)
            if key in seen:
                continue
            seen.add(key)
            us = UserSkill(
                user_id=users[ui].id, skill_id=skills[si].id,
                skill_type=stype, level=lvl,
            )
            db.session.add(us)
            count += 1
        db.session.flush()
        print(f"  Seeded {count} user-skill assignments.")

        # ── Matches (10) ────────────────────────────────────────────
        matches_data = [
            (0, 1, 0, 1, "accepted", 91),
            (0, 3, 0, 3, "accepted", 85),
            (1, 4, 1, 0, "pending", 72),
            (2, 3, 4, 3, "pending", 87),
            (5, 0, 1, 0, "accepted", 78),
            (4, 9, 0, 6, "completed", 65),
            (7, 1, 5, 1, "accepted", 88),
            (6, 12, 2, 12, "pending", 55),
            (11, 10, 15, 8, "completed", 60),
            (13, 5, 18, 1, "accepted", 70),
        ]
        matches = []
        for ri, vi, tsi, lsi, status, score in matches_data:
            m = Match(
                requester_id=users[ri].id, receiver_id=users[vi].id,
                teach_skill_id=skills[tsi].id, learn_skill_id=skills[lsi].id,
                status=status, match_score=score,
            )
            db.session.add(m)
            matches.append(m)
        db.session.flush()
        print(f"  Seeded {len(matches)} matches.")

        # ── Posts (20) ───────────────────────────────────────────────
        post_texts = [
            "Finished my first dashboard with React Query today. Happy to pair with anyone learning API state management this weekend.",
            "Looking for a Figma buddy. I can trade backend API review for help making my portfolio homepage less chaotic.",
            "Tiny win: shipped a component library for our club website. Naming tokens is surprisingly hard.",
            "Just solved my first DP problem without looking at the solution. Small steps!",
            "Anyone interested in a weekly Python study circle? We can cover pandas and matplotlib.",
            "Hot take: learning SQL before any ORM makes you a better developer. Change my mind.",
            "Deployed my first Flask API today. CORS was the real final boss.",
            "Looking for someone to practice mock interviews with. I can help with DSA in return.",
            "Built a personal finance tracker in Excel. Turns out I love spreadsheets more than code sometimes.",
            "Started learning Figma for UI prototyping. Any tips for a complete beginner?",
            "Published my first npm package today! It's a tiny utility but still feels amazing.",
            "Collaborating on open source has taught me more than any course. Highly recommend.",
            "Any Flutter devs here? Want to build a cross-platform study app together.",
            "Machine learning math is intense but the results are so satisfying when it clicks.",
            "Presentation day went great! Public speaking practice really paid off. Thanks to my PeerLift buddy.",
            "Debugging tip: rubber duck debugging actually works. Try explaining your bug out loud.",
            "Looking for a design review partner. I'll review your code if you review my mockups.",
            "Just completed a 30-day coding streak. Consistency > intensity.",
            "Anyone want to do a portfolio review swap this weekend? Frontend or full-stack welcome.",
            "Learned more from teaching React to a beginner than from any advanced tutorial. Teaching is learning.",
        ]
        posts = []
        for i, text in enumerate(post_texts):
            author = users[i % len(users)]
            p = Post(
                author_id=author.id, content=text,
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 720)),
            )
            if i == 6:
                p.is_reported = True
            db.session.add(p)
            posts.append(p)
        db.session.flush()
        print(f"  Seeded {len(posts)} posts.")

        # ── Comments (30) ───────────────────────────────────────────
        comment_texts = [
            "Great work! This is inspiring.",
            "I'd love to pair on this. DM me!",
            "Same here, struggling with the same topic.",
            "Can you share your repo link?",
            "This is exactly what I needed, thanks!",
            "Congrats on the milestone!",
            "I'm interested, let's connect.",
            "What resources did you use?",
            "Brilliant approach, I learned something new.",
            "Would you be open to a weekly session?",
            "I can help with the design part if you need.",
            "Count me in for the study circle!",
            "The best way to learn is to build. Keep going!",
            "I had the same issue with CORS, it's tricky.",
            "Your portfolio looks clean, nice job!",
            "Could you write a blog post about this?",
            "Love this community, so supportive.",
            "Let me know if you need a code review.",
            "This motivates me to start my own project.",
            "Teach me your ways!",
            "I struggled with this too, happy to help.",
            "Great tip, bookmarking this.",
            "How long did it take you?",
            "The consistency approach really works.",
            "Let's set up a study group!",
            "Thanks for sharing this!",
            "Would love to join the swap.",
            "Impressive progress!",
            "DM'd you about collaboration.",
            "This is gold. Following for updates.",
        ]
        comments = []
        for i, text in enumerate(comment_texts):
            c = Comment(
                post_id=posts[i % len(posts)].id,
                author_id=users[(i + 3) % len(users)].id,
                content=text,
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 500)),
            )
            db.session.add(c)
            comments.append(c)
        db.session.flush()
        print(f"  Seeded {len(comments)} comments.")

        # ── Likes (50) ──────────────────────────────────────────────
        like_set = set()
        like_count = 0
        while like_count < 50:
            u = random.choice(users)
            p = random.choice(posts)
            key = (u.id, p.id)
            if key in like_set:
                continue
            like_set.add(key)
            lk = Like(user_id=u.id, post_id=p.id)
            db.session.add(lk)
            like_count += 1
        db.session.flush()
        print(f"  Seeded {like_count} likes.")

        # ── Notifications (15) ──────────────────────────────────────
        notif_data = [
            (1, "match_request", "Rudra Patel wants to do a skill swap with you!"),
            (0, "match_accepted", "Karan Vishwakarma accepted your skill swap request!"),
            (0, "post_like", "Bharathraj M liked your post"),
            (2, "post_comment", "Aarya Mehta commented on your post"),
            (3, "match_request", "Bharathraj M wants to do a skill swap with you!"),
            (0, "new_message", "New message from Karan Vishwakarma"),
            (5, "match_accepted", "Rudra Patel accepted your skill swap request!"),
            (4, "system", "Welcome to PeerLift! Complete your profile to get better matches."),
            (1, "post_like", "Sneha Kulkarni liked your post"),
            (7, "match_request", "Karan Vishwakarma wants to do a skill swap with you!"),
            (0, "post_comment", "Priya Sharma commented on your post"),
            (9, "post_like", "Rudra Patel liked your post"),
            (6, "system", "Your match with Vikram Singh has been completed. Leave a review!"),
            (10, "match_request", "Fatima Khan wants to do a skill swap with you!"),
            (13, "match_accepted", "Priya Sharma accepted your skill swap request!"),
        ]
        for ui, ntype, msg in notif_data:
            n = Notification(
                user_id=users[ui].id, type=ntype, message=msg,
                is_read=random.choice([True, False]),
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 200)),
            )
            db.session.add(n)
        db.session.flush()
        print(f"  Seeded {len(notif_data)} notifications.")

        # ── Messages (20) — in accepted matches ─────────────────────
        accepted = [m for m in matches if m.status == "accepted"]
        msg_texts = [
            "Hey! Excited to start our skill swap.",
            "Same here! When works best for you?",
            "How about weekday evenings, around 7 PM?",
            "Works for me. Let's start with the basics.",
            "I'll prepare some notes for our first session.",
            "Sounds great. I'll share my screen for the demo.",
            "Can you recommend any beginner resources?",
            "Sure, I'll send you a curated list.",
            "Thanks! Looking forward to learning from you.",
            "Let's do a quick intro call first?",
            "Absolutely. I'll set up a Google Meet link.",
            "Got it. See you tomorrow at 7!",
            "Just finished reviewing your code. Nice work!",
            "Thanks for the feedback, really helpful.",
            "Want to try pair programming next session?",
            "Yes! That would be really effective.",
            "I recorded our last session for review. Want the link?",
            "That would be awesome, thanks!",
            "Let's plan the next topic. Any preferences?",
            "Can we cover state management patterns?",
        ]
        msg_count = 0
        for i, text in enumerate(msg_texts):
            if not accepted:
                break
            m = accepted[i % len(accepted)]
            sender = m.requester if i % 2 == 0 else m.receiver
            msg = Message(
                match_id=m.id, sender_id=sender.id, content=text,
                is_read=random.choice([True, False]),
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 100)),
            )
            db.session.add(msg)
            msg_count += 1
        db.session.flush()
        print(f"  Seeded {msg_count} messages.")

        db.session.commit()
        print("\n✅ Database seeded successfully!")
        print(f"   Admin login: rudra@pit.edu / password123")
        print(f"   Student login: karan@piet.edu / password123")


if __name__ == "__main__":
    seed()
