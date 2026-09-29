const $ = (s) => document.querySelector(s);
const api = async (u, o = {}) => {
	const r = await fetch(u, o);
	const d = await r.json();
	if (!r.ok) throw Error(d.erro);
	return d;
};

const toast = (m) => {
	$('#toast').textContent = m;
	$('#toast').style.display = 'block';
	setTimeout(() => $('#toast').style.display = 'none', 3500);
};

const hora = (v) =>
	v
		? new Date(v).toLocaleTimeString('pt-BR', {
				hour: '2-digit',
				minute: '2-digit',
			})
		: '—';

const tempo = (n) =>
	`${n < 0 ? '-' : ''}${String(Math.floor(Math.abs(n) / 60)).padStart(2, '0')}:${String(Math.abs(n) % 60).padStart(2, '0')}`;

async function carregarFuncionarios() {
	const fs = await api('/api/funcionarios');

	for (const sel of [$('#funcionario'), $('#ocFuncionario')]) {
		sel.innerHTML = fs
			.map((f) => `<option value="${f.id}">${f.nome}</option>`)
			.join('');
	}

	await carregarPonto();
}

async function carregarPonto() {
	const id = $('#funcionario').value;
	if (!id) return;

	const d = await api(`/api/ponto/${id}`);
	const r = d.registro;
	const s = d.resumo;
	const registros = [
		['Entrada', r.entrada],
		['Saída para almoço', r.saida_almoco],
		['Retorno do almoço', r.retorno_almoco],
		['Saída', r.saida],
	];

	$('#status').innerHTML =
		registros
			.map(
				(x) =>
					`<div class="registro"><span>${x[0]}</span><strong class="${x[1] ? '' : 'pendente'}">${hora(x[1])}</strong></div>`,
			)
			.join('') +
		`<p><strong>Previsto:</strong> ${tempo(s.meta)} &nbsp; <strong>Saldo:</strong> ${s.completo ? tempo(s.saldo) : 'aguardando'}</p>`;
	$('#pdf').href = `/api/relatorio/${id}/pdf?data=${d.data}`;
}

$('#funcionario').addEventListener('change', carregarPonto);
$('#bater').onclick = async () => {
	try {
		const d = await api(`/api/ponto/${$('#funcionario').value}/bater`, {
			method: 'POST',
		});
		toast(d.mensagem);
		carregarPonto();
	} catch (e) {
		toast(e.message);
	}
};

$('#enviarJust').onclick = async () => {
	const f = $('#arquivo').files[0];
	const obs = $('#obs').value;
	if (!f || !obs.trim()) return toast('Inclua observação e PDF.');

	const fd = new FormData();
	fd.append('observacao', obs);
	fd.append('comprovante', f);

	try {
		const d = await api(`/api/justificativas/${$('#funcionario').value}`, {
			method: 'POST',
			body: fd,
		});
		toast(d.mensagem);
		$('#obs').value = '';
		$('#arquivo').value = '';
	} catch (e) {
		toast(e.message);
	}
};

$('#cadastrar').onclick = async () => {
	try {
		await api('/api/funcionarios', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nome: $('#nome').value,
				email: $('#email').value,
				cargo: $('#cargo').value,
				cargaHorariaMinutos: Number($('#carga').value),
				entrada: $('#entrada').value,
				saidaAlmoco: $('#saidaAlmoco').value,
				retornoAlmoco: $('#retornoAlmoco').value,
				saida: $('#saida').value,
			}),
		});
		toast('Funcionário cadastrado.');
		carregarFuncionarios();
	} catch (e) {
		toast(e.message);
	}
};

$('#salvarOc').onclick = async () => {
	try {
		const d = await api('/api/admin/ocorrencias', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				funcionarioId: $('#ocFuncionario').value,
				data: $('#ocData').value,
				observacao: $('#ocObs').value,
			}),
		});
		toast(d.mensagem);
		$('#ocObs').value = '';
	} catch (e) {
		toast(e.message);
	}
};

async function justificativas() {
	try {
		const js = await api('/api/admin/justificativas');
		$('#listaJust').innerHTML = js.length
			? js
					.map(
						(j) =>
							`<div class="just"><strong>${j.nome}</strong> — ${j.data_referencia}<br>${j.observacao}<br><a href="${j.arquivo_pdf}" target="_blank">Ver comprovante</a> · <em>${j.status}</em>${j.status === 'pendente' ? `<br><button onclick="analisar(${j.id},'aprovada')">Aprovar</button> <button onclick="analisar(${j.id},'recusada')">Recusar</button>` : ''}</div>`,
					)
					.join('')
			: 'Nenhuma justificativa enviada.';
	} catch (e) {
		$('#listaJust').textContent = e.message;
	}
}

window.analisar = async (id, status) => {
	const observacaoAdmin =
		prompt('Observação do administrador (opcional):') ?? '';

	try {
		await api(`/api/admin/justificativas/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status, observacaoAdmin }),
		});
		toast('Justificativa atualizada.');
		justificativas();
	} catch (e) {
		toast(e.message);
	}
};

document.querySelectorAll('nav button').forEach((b) => {
	b.onclick = () => {
		document
			.querySelectorAll('nav button')
			.forEach((x) => x.classList.remove('active'));
		b.classList.add('active');
		document
			.querySelectorAll('.view')
			.forEach((x) => x.classList.toggle('hidden', x.id !== b.dataset.view));

		if (b.dataset.view === 'admin') justificativas();
	};
});

$('#ocData').value = new Date().toLocaleDateString('en-CA');
carregarFuncionarios().catch((e) =>
	toast('Não foi possível conectar: ' + e.message),
);
