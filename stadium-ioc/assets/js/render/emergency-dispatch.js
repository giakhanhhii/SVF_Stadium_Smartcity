const DISPATCH_CFG = {
  medical: {
    defaultType: 'medical',
    openStatus: 'Đang kết nối tổng đài VOC-11 / VOC-12.',
    types: {
      medical: { label: 'Đội y tế', eta: '3 phút' },
      fire: { label: 'Đội cứu hỏa', eta: '5 phút' },
    },
  },
  security: {
    defaultType: 'crowd',
    openStatus: 'Đang kết nối tổng đài an ninh VOC-21 / VOC-22.',
    types: {
      crowd: { label: 'Đội an ninh đám đông', eta: '2 phút' },
      evac: { label: 'Điều phối sơ tán', eta: '4 phút' },
    },
  },
};

const rtByDialog = {};

function getRt(id) {
  if (!rtByDialog[id]) {
    rtByDialog[id] = {
      selectedType: DISPATCH_CFG[id]?.defaultType || 'medical',
      recording: false,
      recordSeconds: 0,
      recordTimer: null,
      etaTimer: null,
      mediaRecorder: null,
      mediaStream: null,
      recordChunks: [],
      recordingUrl: null,
    };
  }
  return rtByDialog[id];
}

let dispatchBound = false;

export function renderDispatchPanel({ id, title, buttonLabel, metaLines, buttonClass = '' }) {
  const meta = metaLines.map((line) => `<span>${line}</span>`).join('');
  return `<section class="hud-block hud-emergency">
    ${title}
    <button type="button" class="hud-emergency__call ${buttonClass}" data-dispatch-open="${id}">
      <i class="ti ti-phone-call"></i><span>${buttonLabel}</span>
    </button>
    <div class="hud-emergency__meta">${meta}</div>
  </section>`;
}

export function renderDispatchDialog(cfg) {
  const lines = cfg.types.map((t, i) =>
    `<button type="button" class="svc-emergency__line${i === 0 ? ' svc-emergency__line--active' : ''}" data-dispatch-type="${t.id}">
      <i class="ti ${t.icon}"></i><span>${t.label}</span><strong>${t.hotline}</strong>
    </button>`,
  ).join('');
  return `<div class="svc-emergency" data-dispatch-dialog="${cfg.id}" hidden>
    <div class="svc-emergency__panel ${cfg.panelClass || ''}" role="dialog" aria-modal="true" aria-label="${cfg.ariaLabel}">
      <button type="button" class="svc-emergency__close" data-dispatch-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="svc-emergency__head">
        <div class="svc-emergency__icon ${cfg.iconClass || ''}"><i class="ti ${cfg.headIcon}"></i></div>
        <div>
          <div class="svc-emergency__eyebrow">${cfg.eyebrow}</div>
          <h3>${cfg.title}</h3>
        </div>
      </div>
      <div class="svc-emergency__lines">${lines}</div>
      <label class="svc-emergency__note">
        <span>${cfg.noteLabel}</span>
        <textarea data-dispatch-note rows="3" placeholder="${cfg.notePlaceholder}"></textarea>
      </label>
      <div class="svc-emergency__rec">
        <button type="button" class="svc-emergency__record" data-dispatch-record>
          <i class="ti ti-microphone"></i><span>Ghi âm mô tả</span>
        </button>
        <span data-dispatch-rec-status>Chưa ghi âm</span>
      </div>
      <div class="svc-emergency__playback" data-dispatch-playback hidden>
        <audio data-dispatch-audio controls></audio>
      </div>
      <div class="svc-emergency__status" data-dispatch-status>
        <i class="ti ti-phone"></i><span>${cfg.readyText}</span>
      </div>
      <div class="svc-emergency__actions">
        <button type="button" class="svc-emergency__end" data-dispatch-end>
          <i class="ti ti-phone-off"></i><span>${cfg.endLabel}</span>
        </button>
      </div>
    </div>
  </div>`;
}

const formatTime = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

function serviceLabel(id, type) {
  return DISPATCH_CFG[id]?.types[type]?.label || '';
}

function resolveDialogInActivePage(id) {
  const activePage = document.querySelector('.page-view.active');
  const inActive = activePage?.querySelector(`[data-dispatch-dialog="${id}"]`);
  if (inActive) return inActive;
  return document.querySelector(`[data-dispatch-dialog="${id}"]`);
}

function showDispatchDialog(dialog) {
  if (!dialog) return;
  if (dialog.parentElement !== document.body) {
    document.body.appendChild(dialog);
  }
  dialog.hidden = false;
}

function bindDispatchDialogs() {
  if (dispatchBound) return;
  dispatchBound = true;

  const setRecordBtn = (dialog, active) => {
    const btn = dialog.querySelector('[data-dispatch-record]');
    btn?.classList.toggle('svc-emergency__record--active', active);
    const span = btn?.querySelector('span');
    if (span) span.textContent = active ? 'Dừng ghi âm' : 'Ghi âm mô tả';
  };

  const cleanupStream = (rt) => {
    rt.mediaStream?.getTracks().forEach((t) => t.stop());
    rt.mediaStream = null;
  };

  const resetRecorder = (dialog, rt) => {
    rt.recording = false;
    if (rt.recordTimer) clearInterval(rt.recordTimer);
    rt.recordTimer = null;
    rt.recordSeconds = 0;
    if (rt.mediaRecorder?.state === 'recording') rt.mediaRecorder.stop();
    rt.mediaRecorder = null;
    rt.recordChunks = [];
    cleanupStream(rt);
    setRecordBtn(dialog, false);
  };

  const attachPlayback = (dialog, rt, blob) => {
    if (rt.recordingUrl) URL.revokeObjectURL(rt.recordingUrl);
    rt.recordingUrl = URL.createObjectURL(blob);
    const audio = dialog.querySelector('[data-dispatch-audio]');
    const playback = dialog.querySelector('[data-dispatch-playback]');
    if (audio) audio.src = rt.recordingUrl;
    if (playback) playback.hidden = false;
  };

  const stopRecording = (dialog, rt, recStatus, status) => {
    if (!rt.recording || !rt.mediaRecorder) return;
    rt.recording = false;
    if (rt.recordTimer) clearInterval(rt.recordTimer);
    rt.recordTimer = null;
    setRecordBtn(dialog, false);
    if (recStatus) recStatus.textContent = `Đã lưu bản ghi âm ${formatTime(rt.recordSeconds)}`;
    if (status) status.textContent = 'Bản ghi âm đã sẵn sàng gửi tới đội phản ứng. Bạn có thể nghe lại trước khi gửi.';
    rt.mediaRecorder.stop();
  };

  const startRecording = async (dialog, rt, recStatus, status) => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      if (recStatus) recStatus.textContent = 'Browser không hỗ trợ ghi âm';
      if (status) status.textContent = 'Không thể truy cập chức năng ghi âm trên trình duyệt này.';
      return;
    }
    try {
      if (rt.recordingUrl) URL.revokeObjectURL(rt.recordingUrl);
      rt.recordingUrl = null;
      dialog.querySelector('[data-dispatch-playback]').hidden = true;
      dialog.querySelector('[data-dispatch-audio]')?.removeAttribute('src');
      rt.recordChunks = [];
      rt.recordSeconds = 0;
      rt.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(rt.mediaStream);
      rt.mediaRecorder = recorder;
      recorder.addEventListener('dataavailable', (ev) => { if (ev.data?.size) rt.recordChunks.push(ev.data); });
      recorder.addEventListener('stop', () => {
        const blob = new Blob(rt.recordChunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size) attachPlayback(dialog, rt, blob);
        cleanupStream(rt);
      }, { once: true });
      recorder.start();
      rt.recording = true;
      setRecordBtn(dialog, true);
      if (recStatus) recStatus.textContent = `Đang ghi âm ${formatTime(0)}`;
      if (status) status.textContent = 'Đang ghi âm mô tả để gửi kèm yêu cầu.';
      rt.recordTimer = setInterval(() => {
        rt.recordSeconds += 1;
        if (recStatus) recStatus.textContent = `Đang ghi âm ${formatTime(rt.recordSeconds)}`;
      }, 1000);
    } catch {
      cleanupStream(rt);
      rt.recording = false;
      setRecordBtn(dialog, false);
      if (recStatus) recStatus.textContent = 'Không có quyền microphone';
      if (status) status.textContent = 'Hãy cấp quyền microphone để ghi âm mô tả sự cố.';
    }
  };

  document.addEventListener('click', async (e) => {
    const openBtn = e.target.closest('[data-dispatch-open]');
    const closeBtn = e.target.closest('[data-dispatch-close]');
    const lineBtn = e.target.closest('[data-dispatch-type]');
    const recordBtn = e.target.closest('[data-dispatch-record]');
    const endBtn = e.target.closest('[data-dispatch-end]');

    const dialog = openBtn
      ? (openBtn.closest('.page-view')?.querySelector(`[data-dispatch-dialog="${openBtn.dataset.dispatchOpen}"]`)
        || resolveDialogInActivePage(openBtn.dataset.dispatchOpen))
      : (closeBtn || lineBtn || recordBtn || endBtn)?.closest('[data-dispatch-dialog]');
    if (!dialog) return;

    const id = dialog.dataset.dispatchDialog;
    const cfg = DISPATCH_CFG[id];
    const rt = getRt(id);
    const status = dialog.querySelector('[data-dispatch-status] span');
    const recStatus = dialog.querySelector('[data-dispatch-rec-status]');

    if (openBtn) {
      rt.selectedType = openBtn.dataset.dispatchTypePreset || cfg.defaultType;
      resetRecorder(dialog, rt);
      showDispatchDialog(dialog);
      dialog.querySelectorAll('[data-dispatch-type]').forEach((btn) => {
        btn.classList.toggle('svc-emergency__line--active', btn.dataset.dispatchType === rt.selectedType);
      });
      if (status) status.textContent = cfg.openStatus;
      if (recStatus) recStatus.textContent = 'Chưa ghi âm';
      dialog.querySelector('[data-dispatch-playback]').hidden = true;
      return;
    }
    if (closeBtn) {
      dialog.hidden = true;
      resetRecorder(dialog, rt);
      if (rt.etaTimer) clearTimeout(rt.etaTimer);
      return;
    }
    if (lineBtn) {
      rt.selectedType = lineBtn.dataset.dispatchType;
      dialog.querySelectorAll('[data-dispatch-type]').forEach((btn) => {
        btn.classList.toggle('svc-emergency__line--active', btn === lineBtn);
      });
      if (status) status.textContent = `Đã chọn ${serviceLabel(id, rt.selectedType).toLowerCase()}. Hãy ghi âm hoặc nhập mô tả sự cố.`;
      return;
    }
    if (recordBtn) {
      if (rt.recording) stopRecording(dialog, rt, recStatus, status);
      else await startRecording(dialog, rt, recStatus, status);
      return;
    }
    if (endBtn) {
      if (rt.recording) stopRecording(dialog, rt, recStatus, status);
      const label = serviceLabel(id, rt.selectedType);
      if (status) status.textContent = `Yêu cầu đang được chuyển đến ${label.toLowerCase()}.`;
      if (rt.etaTimer) clearTimeout(rt.etaTimer);
      rt.etaTimer = setTimeout(() => {
        const info = DISPATCH_CFG[id].types[rt.selectedType];
        if (status) status.textContent = `${label} đã nhận yêu cầu. ETA ${info.eta}.`;
      }, 1300);
    }
  });
}

requestAnimationFrame(bindDispatchDialogs);

/** Mở form dispatch (báo lại từ tab Tổng quan hoặc nơi khác). */
export function openDispatchDialog(id, opts = {}) {
  const dialog = resolveDialogInActivePage(id);
  if (!dialog) return;
  const cfg = DISPATCH_CFG[id];
  const rt = getRt(id);
  const type = opts.type || cfg?.defaultType;
  rt.selectedType = type;
  showDispatchDialog(dialog);
  dialog.querySelectorAll('[data-dispatch-type]').forEach((btn) => {
    btn.classList.toggle('svc-emergency__line--active', btn.dataset.dispatchType === type);
  });
  const note = dialog.querySelector('[data-dispatch-note]');
  if (note && opts.note != null) note.value = opts.note;
  const status = dialog.querySelector('[data-dispatch-status] span');
  const recStatus = dialog.querySelector('[data-dispatch-rec-status]');
  if (status) {
    status.textContent = opts.titleSuffix
      ? `Báo lại yêu cầu ${opts.titleSuffix}. ${cfg?.openStatus || ''}`
      : (cfg?.openStatus || 'Sẵn sàng.');
  }
  if (recStatus) recStatus.textContent = 'Chưa ghi âm';
  const playback = dialog.querySelector('[data-dispatch-playback]');
  if (playback) playback.hidden = true;
  const audio = dialog.querySelector('[data-dispatch-audio]');
  if (audio) audio.removeAttribute('src');
}

export const MEDICAL_DISPATCH = {
  id: 'medical',
  eyebrow: 'VOC Emergency Dispatch',
  title: 'Gọi Y tế / Cứu hỏa',
  headIcon: 'ti-phone-call',
  ariaLabel: 'Gọi Y tế Cứu hỏa',
  noteLabel: 'Vấn đề cần hỗ trợ',
  notePlaceholder: 'Ví dụ: Khán đài B có cổ động viên cần hỗ trợ y tế...',
  readyText: 'Sẵn sàng kết nối tổng đài VOC.',
  endLabel: 'Kết thúc & gửi yêu cầu',
  types: [
    { id: 'medical', icon: 'ti-first-aid-kit', label: 'Y tế khẩn cấp', hotline: '115 · VOC-11' },
    { id: 'fire', icon: 'ti-flame', label: 'Cứu hỏa / sơ tán', hotline: '114 · VOC-12' },
  ],
};

export const SECURITY_DISPATCH = {
  id: 'security',
  eyebrow: 'VOC Crowd Security',
  title: 'Báo an ninh — Dẫm đạp / quá tải',
  headIcon: 'ti-shield-exclamation',
  iconClass: 'svc-emergency__icon--security',
  panelClass: 'svc-emergency__panel--security',
  ariaLabel: 'Báo an ninh dẫm đạp',
  noteLabel: 'Mô tả sự cố & vị trí',
  notePlaceholder: 'Ví dụ: Lối 12 khán đài B — khán giả chen lấn, nguy cơ dẫm đạp...',
  readyText: 'Sẵn sàng báo đội an ninh & điều phối đám đông.',
  endLabel: 'Gửi báo cáo & triển khai lực lượng',
  types: [
    { id: 'crowd', icon: 'ti-users-group', label: 'An ninh đám đông', hotline: '113 · VOC-21' },
    { id: 'evac', icon: 'ti-door-exit', label: 'Mở lối / sơ tán', hotline: 'VOC-22 · PA khẩn' },
  ],
};
