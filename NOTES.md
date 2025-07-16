Where I see this going.
I want something that I can easily build agent frameworks with, and test individual pieces quickly, as described in https://art.openpipe.ai/fundamentals/ruler

But ultimately the goal is I want something where whether I'm building a chat or a single api call I can quickly test out different prompts. Write Unit Tests, maybe in plain text for when they fail, and then keep tweaking them until they pass all the tests

And see a record of my progress ideally

Let's see what I get if I run this right now

---

I appreciate that rumrunner is doing a good bit of the job, especially of caching multi-part functionality, which is kind of good for exploration of a multi-step, complex problem.

It doesn't solve

---

A piece of an agent, a piece of a process,
something that does one thing / Let's call this a module for lack of a better term

- The highest organizing principal
- The API to any function that would accomplish that thing, when I say API, I mean, zod object, the input, could be a message from a user, but could also be more of an object shape
- an array of test-cases, which are just instances of that API, coupled with the grounds on which to judge them. Which could be described as positive signals, negative signals, and failing signals (immediately move it to the bottom)
- Fns[] that accomplish that thing
