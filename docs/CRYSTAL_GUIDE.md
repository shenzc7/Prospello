# 💎 Crystal Core: The Operator's Manual

Welcome, Operator. You have installed the **Crystal Core Protocol**.
This system turns your AI assistant into an autonomous, state-aware agent.

## 🚀 The seamless Workflow (The "Loop")

### 1. 🟢 START
Run the helper script to verify the system and check the active task:

```bash
./crystal start
```

### 2. 📝 EDIT (The Trigger)
The agent follows instructions in **`.crystal/TASKS.md`**.

**How to do it:**
1.  Open `.crystal/TASKS.md`.
2.  Find the `[ACTIVE] Current Directive` section.
3.  Write your task there. Be specific.

**Example:**
```markdown
## [ACTIVE] Current Directive
- [ ] **Task ID: 005** - Fix Login Button
    - **Goal:** The login button is misaligned on mobile.
```

### 3. 🗣️ COMMAND
Once you have saved the file, send this ONE command to the chat:

> **"Execute active task."**

*(The agent will read `.crystal/TASKS.md` and `.crystal/STATE.md` automatically.)*

### 4. 🤖 WATCH & REPEAT
The agent edits the code and updates `.crystal/STATE.md`.
When it's done:
1.  Edit `.crystal/TASKS.md` (mark old as `[x]`, add new one).
2.  Say **"Execute active task."**

---

## 💡 Pro Tips

### "I want to change the rules"
Edit `.crystal/RULES.md`.

### "Check System Status"
Run `./crystal status` to see the current State Hash and Context.

### "I want to plan a huge feature"
In `.crystal/TASKS.md`, set the task to "Plan X". The agent will enter **ARCHITECT** mode.
