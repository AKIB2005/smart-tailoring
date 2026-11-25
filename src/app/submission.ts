/** A synchronous lock also covers repeated events before React renders. */
export class SubmissionGuard {
  private pending = false;
  private submitted = false;
  reset() { if (!this.pending) this.submitted = false; }
  async run(save: () => Promise<boolean>): Promise<boolean> {
    if (this.pending || this.submitted) return false;
    this.pending = true;
    try { this.submitted = await save(); return this.submitted; }
    finally { this.pending = false; }
  }
}
