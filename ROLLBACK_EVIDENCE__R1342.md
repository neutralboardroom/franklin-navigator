# R1342 Rollback Evidence

Platform predecessor rollback point:
- FR-NAV1.30.41-HF3.13.23
- main commit 9932dc243912ecbe6adca7df27cf575a76cfffe3
- preserved exact predecessor artifact in the Franklin Navigator Library release folder.

Runtime rollback point:
- R1341 runtime commit immediately before R1342 recovery changes: ac3a9503875a009ce8e635c2114da8cce7773284
- current runtime branch remains franklin-commerce-runtime-r30.
- rollback must preserve the production database; schema additions used by recovery are backward-compatible existing tables and do not require destructive rollback.
