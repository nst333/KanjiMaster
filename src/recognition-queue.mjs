/** Keep one running job and replace any waiting job with the newest strokes. */
export class LatestRecognitionQueue {
  constructor(send, onResult) {
    this.send = send;
    this.onResult = onResult;
    this.version = 0;
    this.ready = false;
    this.running = null;
    this.pending = null;
  }
  invalidate() { this.version++; this.pending = null; }
  reset() { this.invalidate(); this.running = null; this.ready = false; }
  setReady() { this.ready = true; this.pump(); }
  request(strokes) {
    this.pending = { id: ++this.version, strokes: structuredClone(strokes) };
    this.pump();
  }
  pump() {
    if (!this.ready || this.running || !this.pending) return;
    this.running = this.pending;
    this.pending = null;
    this.send(this.running);
  }
  complete(result) {
    if (result.id !== this.running?.id) return;
    this.running = null;
    if (result.id === this.version) this.onResult(result);
    this.pump();
  }
}
