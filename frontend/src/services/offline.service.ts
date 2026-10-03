import AsyncStorage from '@react-native-async-storage/async-storage';
import { ventasApi } from '@api/ventas.api';
import type { VentaInput } from '@tipos/index';

const QUEUE_KEY = '@tiendaadmin:ventas-pendientes:v1';

export interface VentaPendiente {
	id: string;
	usuarioId: number;
	creadaAt: string;
	total: number;
	payload: VentaInput & { idempotency_key: string };
	ultimoError?: string;
	reintentable?: boolean;
}

export interface ResultadoSincronizacion {
	sincronizadas: number;
	pendientes: number;
	error?: string;
}

let sincronizando = false;

function crearClaveIdempotencia(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function leerCola(): Promise<VentaPendiente[]> {
	const stored = await AsyncStorage.getItem(QUEUE_KEY);
	if (!stored) return [];
	try {
		const parsed: unknown = JSON.parse(stored);
		return Array.isArray(parsed) ? (parsed as VentaPendiente[]) : [];
	} catch {
		return [];
	}
}

async function escribirCola(queue: VentaPendiente[]): Promise<void> {
	await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function crearVentaPendiente(
	payload: VentaInput,
	usuarioId: number,
	total: number,
): VentaPendiente {
	const id = crearClaveIdempotencia();
	return {
		id,
		usuarioId,
		creadaAt: new Date().toISOString(),
		total,
		payload: { ...payload, idempotency_key: id },
	};
}

export async function guardarVentaPendiente(venta: VentaPendiente): Promise<void> {
	const queue = await leerCola();
	if (queue.some((item) => item.id === venta.id)) return;
	queue.push(venta);
	await escribirCola(queue);
}

export async function listarVentasPendientes(
	usuarioId?: number,
): Promise<VentaPendiente[]> {
	const queue = await leerCola();
	return usuarioId === undefined
		? queue
		: queue.filter((venta) => venta.usuarioId === usuarioId);
}

export async function eliminarVentaPendiente(id: string): Promise<void> {
	const queue = await leerCola();
	await escribirCola(queue.filter((venta) => venta.id !== id));
}

function esReintentable(error: unknown): boolean {
	const status = (error as { status?: number } | null)?.status;
	return status === undefined || status === 408 || status === 429 || status >= 500;
}

export async function sincronizarVentasPendientes(
	usuarioId: number,
	force = false,
): Promise<ResultadoSincronizacion> {
	if (sincronizando) {
		const queue = await listarVentasPendientes(usuarioId);
		return { sincronizadas: 0, pendientes: queue.length };
	}

	sincronizando = true;
	let sincronizadas = 0;

	try {
		let queue = await leerCola();
		const pendientes = queue.filter((venta) => venta.usuarioId === usuarioId);

		for (const venta of pendientes) {
			if (!force && venta.reintentable === false) break;

			try {
				await ventasApi.crear(venta.payload);
				queue = queue.filter((item) => item.id !== venta.id);
				await escribirCola(queue);
				sincronizadas += 1;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Error al sincronizar la venta.';
				const retryable = esReintentable(error);
				queue = queue.map((item) =>
					item.id === venta.id
						? { ...item, ultimoError: message, reintentable: retryable }
						: item,
				);
				await escribirCola(queue);
				break;
			}
		}

		const remaining = queue.filter((venta) => venta.usuarioId === usuarioId);
		return {
			sincronizadas,
			pendientes: remaining.length,
			error: remaining.find((venta) => venta.ultimoError)?.ultimoError,
		};
	} finally {
		sincronizando = false;
	}
}
