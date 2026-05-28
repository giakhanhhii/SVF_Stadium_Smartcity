import { hudHead, barChartSvg, ringSvg, areaChartSvg, renderAlerts, camThumb } from './hud-charts.js';

let emergencyCallBound = false;

export function renderServicesLeft(d) {
  const groups = d.parking.groups.map((g) =>
    `<div class="hud-pill hud-pill--${g.tone}"><span class="hud-pill__lbl">${g.label}</span><span class="hud-pill__val">${g.value}%</span></div>`,
  ).join('');
  const feeds = d.services.feeds.map((f) => camThumb(f.label)).join('');
  return `
    <section class="hud-block">${hudHead(d.parking.title)}
      <div class="hud-metric-lbl">${d.parking.totalLabel}</div>
      <div class="hud-metric-big">${d.parking.total}%</div>
      <div class="hud-pill-row">${groups}</div>
    </section>
    <section class="hud-block">${hudHead(d.services.title)}<div class="hud-cam-grid">${feeds}</div></section>
    <div class="hud-tabs hud-tabs--dual">
      <button class="hud-tab hud-tab--active">${d.modeTabs[0]}</button>
      <button class="hud-tab">${d.modeTabs[1]}</button>
    </div>
    <section class="hud-block">${hudHead(d.tickets.title)}
      <div class="hud-inline-stat"><i class="ti ti-ticket"></i><span>${d.tickets.label}</span><strong>${d.tickets.value}</strong></div>
    </section>
    <section class="hud-block">${hudHead(d.queueBars.title)}
      <div class="hud-sub">${d.queueBars.subtitle}</div>${barChartSvg(d.queueBars.bars)}
    </section>`;
}

function renderVocOpsBlock(block, icon) {
  const stats = block.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.change}</div></div>`,
  ).join('');
  return `<section class="hud-block">
    ${hudHead(block.title)}
    <div class="hud-inline-stat"><i class="ti ${icon}"></i><span>VOC / FIFA</span><strong>${block.status}</strong></div>
    <div class="hud-energy-grid">${stats}</div>
  </section>`;
}

function emergencyCallPanel() {
  return `<section class="hud-block hud-emergency">
    ${hudHead('Gọi Y tế / Cứu hỏa')}
    <button type="button" class="hud-emergency__call" data-emergency-open>
      <i class="ti ti-phone-call"></i>
      <span>Gọi Y tế / Cứu hỏa</span>
    </button>
    <div class="hud-emergency__meta">
      <span><i class="ti ti-first-aid-kit"></i> Y tế: 115 / VOC-11</span>
      <span><i class="ti ti-flame"></i> Cứu hỏa: 114 / VOC-12</span>
    </div>
  </section>`;
}

function emergencyCallDialog() {
  return `<div class="svc-emergency" data-emergency-dialog hidden>
    <div class="svc-emergency__panel" role="dialog" aria-modal="true" aria-label="Gọi Y tế Cứu hỏa">
      <button type="button" class="svc-emergency__close" data-emergency-close aria-label="Đóng"><i class="ti ti-x"></i></button>
      <div class="svc-emergency__head">
        <div class="svc-emergency__icon"><i class="ti ti-phone-call"></i></div>
        <div>
          <div class="svc-emergency__eyebrow">VOC Emergency Dispatch</div>
          <h3>Gọi Y tế / Cứu hỏa</h3>
        </div>
      </div>
      <div class="svc-emergency__lines">
        <button type="button" class="svc-emergency__line svc-emergency__line--active" data-emergency-type="medical">
          <i class="ti ti-first-aid-kit"></i><span>Y tế khẩn cấp</span><strong>115 · VOC-11</strong>
        </button>
        <button type="button" class="svc-emergency__line" data-emergency-type="fire">
          <i class="ti ti-flame"></i><span>Cứu hỏa / sơ tán</span><strong>114 · VOC-12</strong>
        </button>
      </div>
      <label class="svc-emergency__note">
        <span>Vấn đề cần hỗ trợ</span>
        <textarea data-emergency-note rows="3" placeholder="Ví dụ: Khán đài B có cổ động viên cần hỗ trợ y tế..."></textarea>
      </label>
      <div class="svc-emergency__rec">
        <button type="button" class="svc-emergency__record" data-emergency-record>
          <i class="ti ti-microphone"></i><span>Ghi âm mô tả</span>
        </button>
        <span data-emergency-rec-status>Chưa ghi âm</span>
      </div>
      <div class="svc-emergency__playback" data-emergency-playback hidden>
        <audio data-emergency-audio controls></audio>
      </div>
      <div class="svc-emergency__status" data-emergency-status>
        <i class="ti ti-phone"></i><span>Sẵn sàng kết nối tổng đài VOC.</span>
      </div>
      <div class="svc-emergency__actions">
        <button type="button" class="svc-emergency__end" data-emergency-end>
          <i class="ti ti-phone-off"></i><span>Kết thúc & gửi yêu cầu</span>
        </button>
      </div>
    </div>
  </div>`;
}

function bindEmergencyCall() {
  if (emergencyCallBound) return;
  emergencyCallBound = true;
  let selectedType = 'medical';
  let recording = false;
  let etaTimer = null;
  let recordTimer = null;
  let recordSeconds = 0;
  let mediaRecorder = null;
  let mediaStream = null;
  let recordChunks = [];
  let recordingUrl = null;

  const serviceLabel = () => (selectedType === 'fire' ? 'Đội cứu hỏa' : 'Đội y tế');
  const eta = () => (selectedType === 'fire' ? '5 phút' : '3 phút');
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  const cleanupStream = () => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  };
  const setRecordButton = (dialog, active) => {
    const record = dialog.querySelector('[data-emergency-record]');
    record?.classList.toggle('svc-emergency__record--active', active);
    const recordText = record?.querySelector('span');
    if (recordText) recordText.textContent = active ? 'Dừng ghi âm' : 'Ghi âm mô tả';
  };
  const resetRecorder = (dialog) => {
    recording = false;
    if (recordTimer) clearInterval(recordTimer);
    recordTimer = null;
    recordSeconds = 0;
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    mediaRecorder = null;
    recordChunks = [];
    cleanupStream();
    setRecordButton(dialog, false);
  };
  const attachPlayback = (dialog, blob) => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = URL.createObjectURL(blob);
    const audio = dialog.querySelector('[data-emergency-audio]');
    const playback = dialog.querySelector('[data-emergency-playback]');
    if (audio) audio.src = recordingUrl;
    if (playback) playback.hidden = false;
  };
  const stopRecording = (dialog, recStatus, status) => {
    if (!recording || !mediaRecorder) return;
    recording = false;
    if (recordTimer) clearInterval(recordTimer);
    recordTimer = null;
    setRecordButton(dialog, false);
    if (recStatus) recStatus.textContent = `Đã lưu bản ghi âm ${formatTime(recordSeconds)}`;
    if (status) status.textContent = 'Bản ghi âm đã sẵn sàng gửi tới đội phản ứng. Bạn có thể nghe lại trước khi gửi.';
    mediaRecorder.stop();
  };
  const startRecording = async (dialog, recStatus, status) => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      if (recStatus) recStatus.textContent = 'Browser không hỗ trợ ghi âm';
      if (status) status.textContent = 'Không thể truy cập chức năng ghi âm trên trình duyệt này.';
      return;
    }
    try {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      recordingUrl = null;
      const playback = dialog.querySelector('[data-emergency-playback]');
      const audio = dialog.querySelector('[data-emergency-audio]');
      if (playback) playback.hidden = true;
      if (audio) audio.removeAttribute('src');

      recordChunks = [];
      recordSeconds = 0;
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(mediaStream);
      mediaRecorder = recorder;
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data?.size) recordChunks.push(event.data);
      });
      recorder.addEventListener('stop', () => {
        const blob = new Blob(recordChunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size) attachPlayback(dialog, blob);
        cleanupStream();
      }, { once: true });
      recorder.start();
      recording = true;
      setRecordButton(dialog, true);
      if (recStatus) recStatus.textContent = `Đang ghi âm ${formatTime(recordSeconds)}`;
      if (status) status.textContent = 'Đang ghi âm mô tả để gửi kèm yêu cầu.';
      if (recordTimer) clearInterval(recordTimer);
      recordTimer = setInterval(() => {
        recordSeconds += 1;
        if (recStatus) recStatus.textContent = `Đang ghi âm ${formatTime(recordSeconds)}`;
      }, 1000);
    } catch (err) {
      cleanupStream();
      recording = false;
      setRecordButton(dialog, false);
      if (recStatus) recStatus.textContent = 'Không có quyền microphone';
      if (status) status.textContent = 'Hãy cấp quyền microphone để ghi âm mô tả sự cố.';
    }
  };

  document.addEventListener('click', async (e) => {
    const openBtn = e.target.closest('[data-emergency-open]');
    const closeBtn = e.target.closest('[data-emergency-close]');
    const lineBtn = e.target.closest('[data-emergency-type]');
    const recordBtn = e.target.closest('[data-emergency-record]');
    const endBtn = e.target.closest('[data-emergency-end]');
    const dialog = document.querySelector('[data-emergency-dialog]');
    if (!dialog) return;

    const status = dialog.querySelector('[data-emergency-status] span');
    const recStatus = dialog.querySelector('[data-emergency-rec-status]');

    if (openBtn) {
      selectedType = 'medical';
      resetRecorder(dialog);
      dialog.hidden = false;
      dialog.querySelectorAll('[data-emergency-type]').forEach((btn) => {
        btn.classList.toggle('svc-emergency__line--active', btn.dataset.emergencyType === selectedType);
      });
      if (status) status.textContent = 'Đang kết nối tổng đài VOC-11 / VOC-12.';
      if (recStatus) recStatus.textContent = 'Chưa ghi âm';
      const playback = dialog.querySelector('[data-emergency-playback]');
      if (playback) playback.hidden = true;
      return;
    }

    if (closeBtn) {
      dialog.hidden = true;
      resetRecorder(dialog);
      if (etaTimer) clearTimeout(etaTimer);
      return;
    }

    if (lineBtn) {
      selectedType = lineBtn.dataset.emergencyType;
      dialog.querySelectorAll('[data-emergency-type]').forEach((btn) => {
        btn.classList.toggle('svc-emergency__line--active', btn === lineBtn);
      });
      if (status) status.textContent = `Đã chọn ${serviceLabel().toLowerCase()}. Hãy ghi âm hoặc nhập mô tả sự cố.`;
      return;
    }

    if (recordBtn) {
      if (recording) stopRecording(dialog, recStatus, status);
      else await startRecording(dialog, recStatus, status);
      return;
    }

    if (endBtn) {
      if (recording) stopRecording(dialog, recStatus, status);
      if (status) status.textContent = `Yêu cầu đang được chuyển đến ${serviceLabel().toLowerCase()}.`;
      if (etaTimer) clearTimeout(etaTimer);
      etaTimer = setTimeout(() => {
        if (status) status.textContent = `${serviceLabel()} đã nhận yêu cầu và đang trên đường đến. ETA ${eta()}.`;
      }, 1300);
    }
  });
}

export function renderServicesRight(d) {
  const tabs = d.fb.tabs.map((t, i) =>
    `<button class="hud-tab${i === 0 ? ' hud-tab--active' : ''}">${t}</button>`,
  ).join('');
  const bars = d.fb.metrics.map((m) =>
    `<div class="hud-bar-item"><div class="hud-bar-head"><span>${m.label}</span><strong>${m.value}</strong></div>
    <div class="hud-bar-track"><div class="hud-bar-fill" style="width:${m.pct}%"></div></div></div>`,
  ).join('');
  const stats = d.revenue.stats.map((s) =>
    `<div class="hud-energy-cell"><div class="hud-energy-lbl">${s.label}</div><div class="hud-energy-val">${s.value}</div>
    <div class="hud-energy-trend hud-energy-trend--${s.trend}">${s.trend === 'up' ? '▲' : '▼'} ${s.change}</div></div>`,
  ).join('');
  return `
    <section class="hud-block">${hudHead('Dịch vụ & Phản hồi')}${renderAlerts(d.alerts)}</section>
    ${emergencyCallPanel()}
    ${renderVocOpsBlock(d.medical, 'ti-first-aid-kit')}
    ${renderVocOpsBlock(d.fire, 'ti-flame')}
    <section class="hud-block">${hudHead(d.fb.title)}<div class="hud-tabs">${tabs}</div>
      <div class="hud-env-row">${ringSvg(78, 'Bãi đỗ')}<div class="hud-env-bars">${bars}</div></div>
    </section>
    <section class="hud-block">${hudHead(d.traffic.title)}
      <div class="hud-device-status">Cảnh báo: <span class="hud-badge">${d.traffic.status}</span></div>
      <div class="hud-vent-row">${d.traffic.lanes.map((v) => `<button class="hud-vent-btn">${v}</button>`).join('')}</div>
    </section>
    <section class="hud-block hud-block--grow">${hudHead(d.revenue.title)}
      <div class="hud-energy-grid">${stats}</div>${areaChartSvg(d.revenue.chart, 'svcGrad')}
    </section>
    ${emergencyCallDialog()}`;
}

requestAnimationFrame(bindEmergencyCall);
