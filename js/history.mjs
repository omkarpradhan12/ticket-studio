export class History {
  constructor({ limit = 100, onChange = () => {} } = {}) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError("History limit must be a positive integer.");
    this.limit = limit;
    this.onChange = onChange;
    this.listeners = new Set();
    this.undoStack = [];
    this.redoStack = [];
    this.present = null;
    this.activeCoalesceKey = null;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  get undoLabel() {
    const entry = this.undoStack.at(-1);
    return entry ? `Undo: ${entry.label}` : "Undo";
  }

  get redoLabel() {
    const entry = this.redoStack.at(-1);
    return entry ? `Redo: ${entry.label}` : "Redo";
  }

  isCoalescing(coalesceKey) {
    return this.activeCoalesceKey === coalesceKey;
  }

  notify() {
    this.onChange(this);
    for (const listener of this.listeners) listener(this);
  }

  initialize(snapshot) {
    this.present = snapshot;
    this.undoStack = [];
    this.redoStack = [];
    this.activeCoalesceKey = null;
    this.notify();
  }

  refresh(snapshot) {
    if (this.present !== null) this.present = snapshot;
  }

  record(snapshot, label, coalesceKey = null) {
    if (this.present === null) {
      this.initialize(snapshot);
      return;
    }

    const coalescing = coalesceKey !== null
      && this.activeCoalesceKey === coalesceKey
      && this.undoStack.at(-1)?.coalesceKey === coalesceKey;
    if (!coalescing) {
      this.undoStack.push({ snapshot: this.present, label, coalesceKey });
      if (this.undoStack.length > this.limit) this.undoStack.shift();
    }
    this.present = snapshot;
    this.redoStack = [];
    this.activeCoalesceKey = coalesceKey;
    this.notify();
  }

  endCoalescing(coalesceKey = null) {
    if (coalesceKey === null || this.activeCoalesceKey === coalesceKey) {
      this.activeCoalesceKey = null;
    }
  }

  undo() {
    if (!this.canUndo) return null;
    this.activeCoalesceKey = null;
    const entry = this.undoStack.pop();
    this.redoStack.push({ snapshot: this.present, label: entry.label });
    this.present = entry.snapshot;
    this.notify();
    return { snapshot: this.present, label: entry.label };
  }

  redo() {
    if (!this.canRedo) return null;
    this.activeCoalesceKey = null;
    const entry = this.redoStack.pop();
    this.undoStack.push({ snapshot: this.present, label: entry.label, coalesceKey: null });
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.present = entry.snapshot;
    this.notify();
    return { snapshot: this.present, label: entry.label };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
