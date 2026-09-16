# DURABLE RULE — FRANKLIN ASSISTANT PUBLIC PRESENTATION

Authority: Roger owner rule
Effective: 2026-09-16
Applies to: Franklin Assistant and all future successors unless Roger explicitly changes it.

## Public name

The public-facing product name is **Franklin Assistant**.

Internal architecture names, generation numbers, release numbers, experiment names, and labels such as "Assistant 2", "v2", R-numbers, runtime modes, or internal controller names must not appear as the user-facing Assistant name.

## Answer presentation

Normal Franklin Assistant answers must appear **inline on the same page** with the question experience.

Do not move ordinary answers into a popup, modal, separate dialog, forced new page, or other interruption.

A separate page may still exist as a dedicated Ask Franklin destination, but answers on that page also remain inline in its conversation/work area.

## Core controls

The public Assistant should provide, when technically supported:
- Ask/submit;
- Clear / new question, which clears the input, current visible answer and current-page conversation context;
- Speak, using browser/device speech recognition when available;
- Attach document, screenshot or photo.

If voice is not supported by the browser, it may remain unavailable rather than presenting a broken control.

Attachments should be processed on-device when reasonably possible. Do not silently upload raw attachment contents to web search. Clearly tell the user when a file is being read locally and preserve the existing sensitive-data warnings.

## Visual continuity

Preserve the approved Franklin Navigator visual shell, typography, spacing, card treatment and same-page layout unless there is a user-tested reason to change it.

## Architecture boundary

Restoring a useful control must not reconnect the retired Franklin Assistant 1 routing/controller/runtime stack. Rebuild the capability directly in the current clean Assistant architecture.

## Current-information questions

Questions whose answer depends on current dates, events, schedules, meetings, "today", "tomorrow", "this weekend", or similar freshness must attempt to retrieve and summarize the actual matching current information. Merely telling the user to check a calendar or source page is not a sufficient answer when current retrieval succeeds.
