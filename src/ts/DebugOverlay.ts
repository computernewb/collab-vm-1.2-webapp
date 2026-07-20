import CollabVMClient, { DebugStats } from './protocol/CollabVMClient.js';
import { Rank } from './protocol/Permissions.js';
import VM from './protocol/VM.js';
import pkg from '../../package.json';

const READY_STATES = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];

function pad2(n: number): string {
	return n < 10 ? '0' + n : '' + n;
}

function esc(v: string): string {
	return v.replace(/[&<>"']/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'));
}

function fmtClock(epoch: number): string {
	let d = new Date(epoch);
	return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function fmtDuration(ms: number): string {
	let s = Math.floor(ms / 1000);
	let h = Math.floor(s / 3600);
	let m = Math.floor((s % 3600) / 60);
	return `${pad2(h)}:${pad2(m)}:${pad2(s % 60)}`;
}

function fmtBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtRate(perSec: number): string {
	if (perSec < 1024) return `${perSec.toFixed(0)} B/s`;
	if (perSec < 1024 * 1024) return `${(perSec / 1024).toFixed(1)} KB/s`;
	return `${(perSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

function rankName(rank: Rank): string {
	switch (rank) {
		case Rank.Admin:
			return 'Admin';
		case Rank.Moderator:
			return 'Moderator';
		case Rank.Registered:
			return 'Registered';
		default:
			return 'Unregistered';
	}
}

interface RateSample {
	t: number;
	rx: number;
	tx: number;
	rxb: number;
	txb: number;
	rects: number;
}

export default class DebugOverlay {
	private el: HTMLDivElement;
	private client: CollabVMClient | null = null;
	private vmList: VM[] = [];
	private visible: boolean = false;
	private timer: ReturnType<typeof setInterval> | null = null;
	private prev: RateSample | null = null;
	private rxRate: number = 0;
	private txRate: number = 0;
	private rxbRate: number = 0;
	private txbRate: number = 0;
	private fps: number = 0;

	constructor() {
		this.el = document.createElement('div');
		this.el.id = 'debugOverlay';
		this.el.style.display = 'none';
		document.body.appendChild(this.el);
	}

	setVmList(vms: VM[]) {
		this.vmList = vms;
	}

	attach(client: CollabVMClient) {
		this.client = client;
		this.prev = null;
	}

	detach() {
		this.client = null;
		this.prev = null;
		if (this.visible) this.render();
	}

	toggle() {
		if (this.visible) this.hide();
		else this.show();
	}

	show() {
		this.visible = true;
		this.el.style.display = 'block';
		this.prev = null;
		this.render();
		this.timer = setInterval(() => this.render(), 250);
	}

	hide() {
		this.visible = false;
		this.el.style.display = 'none';
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
		this.prev = null;
	}

	private render() {
		if (this.client === null) {
			this.el.innerHTML = this.buildHome();
			return;
		}

		let s = this.client.getDebugStats();
		let now = performance.now();
		if (this.prev !== null) {
			let dt = (now - this.prev.t) / 1000;
			if (dt > 0) {
				this.rxRate = (s.rxPackets - this.prev.rx) / dt;
				this.txRate = (s.txPackets - this.prev.tx) / dt;
				this.rxbRate = (s.rxBytes - this.prev.rxb) / dt;
				this.txbRate = (s.txBytes - this.prev.txb) / dt;
				this.fps = (s.rects - this.prev.rects) / dt;
			}
		}
		this.prev = { t: now, rx: s.rxPackets, tx: s.txPackets, rxb: s.rxBytes, txb: s.txBytes, rects: s.rects };

		this.el.innerHTML = this.buildConnected(s);
	}

	private buildHome(): string {
		let out = this.section('Webapp');
		out += this.row('Name', 'CollabVM Webapp');
		out += this.row('Package', pkg.name);
		out += this.row('Version', pkg.version);
		out += this.row('VMs listed', `${this.vmList.length}`);
		out += this.row('Window', `${window.innerWidth} × ${window.innerHeight}`);
		out += this.row('Pixel ratio', `${window.devicePixelRatio}`);

		out += this.section(`VMs (${this.vmList.length})`);
		if (this.vmList.length === 0) {
			out += `<div class="dbg-k">No VMs loaded</div>`;
		} else {
			for (let vm of this.vmList) {
				out += `<div class="dbg-vm"><span class="dbg-id">${esc(vm.id)}</span> — ${esc(vm.displayName)}<br><span class="dbg-k">${esc(vm.url)}</span></div>`;
			}
		}
		return out;
	}

	private buildConnected(s: DebugStats): string {
		let stateOk = s.wsReadyState === WebSocket.OPEN;

		let out = this.section('Connection');
		out += this.row('Status', s.connectedToVM ? 'Connected' : READY_STATES[s.wsReadyState] ?? '?', s.connectedToVM ? '' : stateOk ? 'dbg-warn' : 'dbg-bad');
		out += this.row('Server', s.url);
		out += this.row('Node', s.node ?? '—');
		out += this.row('Subprotocol', s.subprotocol);
		out += this.row('Binary rects', s.binaryRects ? 'yes' : 'no');
		out += this.row('Account auth', s.accountAuth ? 'yes' : 'no');
		out += this.row('Capabilities', s.capabilities.length ? s.capabilities.join(', ') : 'none');
		out += this.row('WS opened', s.wsOpenTime !== null ? fmtClock(s.wsOpenTime) : '—');
		out += this.row('Connected at', s.vmConnectTime !== null ? fmtClock(s.vmConnectTime) : '—');
		out += this.row('Uptime', s.vmConnectTime !== null ? fmtDuration(Date.now() - s.vmConnectTime) : '—');

		out += this.section('Traffic');
		out += this.row('Recv', `${s.rxPackets} pkts (${this.rxRate.toFixed(1)}/s)`);
		out += this.row('Recv data', `${fmtBytes(s.rxBytes)} (${fmtRate(this.rxbRate)})`);
		out += this.row('Sent', `${s.txPackets} pkts (${this.txRate.toFixed(1)}/s)`);
		out += this.row('Sent data', `${fmtBytes(s.txBytes)} (${fmtRate(this.txbRate)})`);
		out += this.row('Last opcode', s.lastOpcode ?? '—');
		let sinceMsg = s.lastRxTime !== null ? Date.now() - s.lastRxTime : null;
		out += this.row('Since last', sinceMsg !== null ? `${sinceMsg} ms` : '—', sinceMsg !== null && sinceMsg > 8000 ? 'dbg-bad' : '');

		out += this.section('Display');
		out += this.row('Screen', s.screenWidth ? `${s.screenWidth} × ${s.screenHeight}` : '—');
		out += this.row('Canvas', s.canvasWidth ? `${Math.round(s.canvasWidth)} × ${Math.round(s.canvasHeight)}` : '—');
		let scaled = s.screenWidth !== 0 && (s.canvasWidth !== s.screenWidth || s.canvasHeight !== s.screenHeight);
		out += this.row('Scaled', scaled ? 'yes (downscaled)' : 'no (1:1)');
		out += this.row('Window', `${window.innerWidth} × ${window.innerHeight}`);
		out += this.row('Pixel ratio', `${window.devicePixelRatio}`);
		out += this.row('FPS (rects/s)', this.fps.toFixed(1));
		out += this.row('Rects total', `${s.rects}`);

		out += this.section('Session');
		out += this.row('Username', s.username ?? '—');
		out += this.row('Rank', rankName(s.rank));
		if (s.rank === Rank.Admin || s.rank === Rank.Moderator) out += this.row('Perms', s.perms.length ? s.perms.join(', ') : 'none');
		out += this.row('Ghost turn', s.ghostTurn ? 'on' : 'off');
		out += this.row('Users online', `${s.users}`);
		out += this.row('Turn', s.turnUser ?? 'nobody');
		out += this.row('Queue', `${s.queueLength}`);
		out += this.row('Vote', s.voteActive ? `active (yes ${s.voteYes} / no ${s.voteNo})` : 'none');

		return out;
	}

	private section(title: string): string {
		return `<div class="dbg-h">${esc(title)}</div>`;
	}

	private row(label: string, value: string, cls: string = ''): string {
		return `<div><span class="dbg-k">${label}:</span> <span class="${cls}">${esc(value)}</span></div>`;
	}
}
