import assert from "node:assert/strict";
import { History } from "../js/history.mjs";

const state = value => ({ value });

{
  const history = new History();
  history.initialize(state(0));
  history.record(state(1), "change title", "title");
  history.record(state(2), "change title", "title");
  assert.equal(history.undo().snapshot.value, 0);
  assert.equal(history.redo().snapshot.value, 2);

  history.record(state(3), "change title", "title");
  history.endCoalescing("title");
  history.record(state(4), "change title", "title");
  assert.equal(history.undo().snapshot.value, 3);
  assert.equal(history.undo().snapshot.value, 2);
}

{
  const history = new History({ limit: 100 });
  history.initialize(state(0));
  for (let value = 1; value <= 105; value++) history.record(state(value), "edit");
  for (let count = 0; count < 100; count++) history.undo();
  assert.equal(history.present.value, 5);
  assert.equal(history.canUndo, false);
}

{
  const history = new History();
  history.initialize(state(0));
  history.record(state(1), "first edit");
  history.undo();
  history.record(state(2), "replacement edit");
  assert.equal(history.canRedo, false);
}

{
  const history = new History();
  const sharedCard = { title: "unchanged", img: "data:image/jpeg;base64,abc" };
  const futureCard = { title: "new", borderStyle: 3, stampPosition: { x: 0.4, y: 0.6 } };
  const before = { cards: [sharedCard], count: 1 };
  const after = { cards: [sharedCard, futureCard], count: 2 };
  history.initialize(before);
  history.record(after, "add card");
  assert.equal(history.undo().snapshot.cards[0], sharedCard);
  const redone = history.redo().snapshot;
  assert.equal(redone.cards[0], sharedCard);
  assert.equal(redone.cards[1], futureCard);
  assert.deepEqual(redone.cards[1].stampPosition, { x: 0.4, y: 0.6 });
}

console.log("History module tests passed.");
