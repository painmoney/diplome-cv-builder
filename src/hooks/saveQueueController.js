/**
 * Resume save queue controller — pure state machine, no React dependencies.
 *
 * Accepts RPC functions via constructor for testability.
 */
export class SaveQueue {
  constructor({ userRef, setSaveStatus, setSaveError, setMessage, rpcs }) {
    this.userRef = userRef;
    this.setSaveStatus = setSaveStatus;
    this.setSaveError = setSaveError;
    this.setMessage = setMessage;
    this.rpcs = rpcs; // { createResumeFullRpc, saveResumeFullRpc, saveProfile, normalizeLoadedResumeData }

    this.resumeId = null;
    this.revision = null;
    this.inFlight = false;
    this.pending = null;
    this.generation = 0;
    this.stopped = false;
  }

  async drain() {
    if (this.stopped) return;
    if (this.inFlight) return;
    if (!this.pending) return;

    const snapshot = this.pending;
    this.pending = null;
    this.inFlight = true;

    const myGen = this.generation;
    const { createResumeFullRpc, saveResumeFullRpc, saveProfile, normalizeLoadedResumeData } = this.rpcs;

    try {
      this.setSaveStatus("saving");
      this.setSaveError("");

      const user = this.userRef.current;
      if (!user) {
        this.inFlight = false;
        return;
      }

      const resumeData = normalizeLoadedResumeData(snapshot.data);
      let result;

      if (this.revision === null) {
        result = await createResumeFullRpc({
          resumeId: snapshot.resumeId,
          title: snapshot.title,
          template: resumeData.template,
          data: resumeData,
        });
      } else {
        result = await saveResumeFullRpc({
          resumeId: snapshot.resumeId,
          title: snapshot.title,
          template: resumeData.template,
          data: resumeData,
          expectedRevision: this.revision,
        });
      }

      if (this.generation !== myGen) return;

      this.resumeId = result.resumeId;
      this.revision = result.revision;

      let profileFailed = false;
      try {
        await saveProfile(user.id, resumeData.profile);
      } catch {
        profileFailed = true;
      }

      if (this.generation !== myGen) return;

      if (profileFailed) {
        this.setSaveStatus("error");
        this.setSaveError("Резюме сохранено, но данные профиля синхронизировать не удалось.");
        this.inFlight = false;
        if (this.pending) this.drain();
        return;
      }

      this.setSaveStatus("saved");

      if (this.pending) {
        this.inFlight = false;
        this.drain();
        return;
      }

      this.inFlight = false;
    } catch (err) {
      if (this.generation !== myGen) return;

      this.inFlight = false;

      const code = err?.code;

      if (code === "P1005") {
        this.stopped = true;
        if (this.pending === null) this.pending = snapshot;
        this.setSaveStatus("conflict");
        this.setSaveError("Резюме было изменено в другой вкладке. Обновите страницу.");
        if (snapshot.reason === "manual") {
          this.setMessage("Резюме было изменено в другой вкладке. Обновите страницу.");
        }
        return;
      }

      if (code === "P1003") {
        this.stopped = true;
        if (this.pending === null) this.pending = snapshot;
        this.setSaveStatus("conflict");
        this.setSaveError("Для этого аккаунта уже существует другое резюме.");
        return;
      }

      if (code === "P1004") {
        this.setSaveStatus("error");
        this.setSaveError("Резюме не найдено или доступ к нему потерян.");
        return;
      }

      if (code === "P1002") {
        this.setSaveStatus("error");
        this.setSaveError("Ошибка данных. Проверьте заполнение.");
        return;
      }

      if (this.pending === null) this.pending = snapshot;
      this.setSaveStatus("error");
      this.setSaveError(err?.message || "Ошибка сохранения");
      if (snapshot.reason === "manual") {
        this.setMessage(`Ошибка: ${err?.message || "Неизвестная ошибка"}`);
      }
    }
  }

  enqueue(snapshot) {
    if (this.stopped) {
      this.pending = snapshot;
      return;
    }
    this.pending = snapshot;
    this.drain();
  }

  resetGeneration() {
    this.generation += 1;
    this.inFlight = false;
    this.stopped = false;
    this.pending = null;
    this.resumeId = null;
    this.revision = null;
    this.setSaveStatus("idle");
    this.setSaveError("");
  }

  initFromLoad(loadedResume) {
    if (loadedResume) {
      this.resumeId = loadedResume.resumeId;
      this.revision = loadedResume.revision;
    } else {
      this.resumeId = crypto.randomUUID();
      this.revision = null;
    }
  }
}
