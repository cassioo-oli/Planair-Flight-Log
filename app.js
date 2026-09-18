// Configuração dos links e IDs das perguntas do seu Google Forms

const PLANAIR_PONTO_CONFIG = {
  // URL corrigida para o endpoint de respostas (/formResponse)
  formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfxfH795yEjAPWLEIpBKM5qAQqqBRtC1G8NVyUu1EvJ70qeKQ/formResponse",

  // Códigos entry.XXXXXXXXX das suas 4 perguntas no Google Forms
  entries: {
    nome: "entry.1499582009",         // Pergunta: "Nome do Tripulante"
    dataRegistro: "entry.1118001109", // Pergunta: "Data"
    tipoRegistro: "entry.72209740",   // Pergunta: "Tipo de Registro"
    horario: "entry.886735282"        // Pergunta: "Horário"
  }
};

const pontoForm = document.getElementById("pontoForm");
const statusMsg = document.getElementById("statusMsg");

// Função para montar os dados no formato aceito pelo Google Forms
function criarFormDataPonto(dados) {
  const formData = new URLSearchParams();

  formData.append(PLANAIR_PONTO_CONFIG.entries.nome, dados.nome);
  formData.append(PLANAIR_PONTO_CONFIG.entries.dataRegistro, dados.dataRegistro);
  formData.append(PLANAIR_PONTO_CONFIG.entries.tipoRegistro, dados.tipoRegistro);
  formData.append(PLANAIR_PONTO_CONFIG.entries.horario, dados.horario);

  return formData;
}

// Envia os dados sem redirecionar a página (modo no-cors)
async function enviarParaGoogleSheets(dados) {
  const formData = criarFormDataPonto(dados);

  await fetch(PLANAIR_PONTO_CONFIG.formUrl, {
    method: "POST",
    mode: "no-cors",
    body: formData
  });
}

// Evento disparado quando o usuário clica em "REGISTRAR AGORA"
pontoForm.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const btnBoarding = pontoForm.querySelector('.btn-boarding');
  const nomeInput = document.getElementById("nome").value;
  const tipoSelecionado = pontoForm.querySelector('input[name="tipo_registro"]:checked').value;

  // Pega data e hora exatas do dispositivo no momento do clique
  const agora = new Date();
  const dataHoje = agora.toLocaleDateString('pt-BR'); // Ex: "18/09/2026"
  const horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); // Ex: "14:30"

  const dadosProntos = {
    nome: nomeInput,
    dataRegistro: dataHoje,
    tipoRegistro: tipoSelecionado,
    horario: horaAtual
  };

  // Trava o botão e avisa que está enviando
  btnBoarding.disabled = true;
  btnBoarding.style.opacity = "0.6";
  statusMsg.style.color = "#005bb5";
  statusMsg.textContent = "⏳ Registrando ponto na planilha...";

  try {
    // Envia os dados para o Google Forms/Sheets
    await enviarParaGoogleSheets(dadosProntos);

    // Confirmação no HTML após carregamento dos dados
    statusMsg.style.color = "#28a745";
    statusMsg.innerHTML = `✅ <strong>Ponto Registrado!</strong><br>${tipoSelecionado} às ${horaAtual} (${dataHoje})`;

    // Limpa a seleção e campo após confirmação
    document.getElementById("nome").value = "";
    document.getElementById("entrada").checked = true;

  } catch (erro) {
    console.error(erro);
    statusMsg.style.color = "#dc3545";
    statusMsg.textContent = "❌ Erro ao enviar para a planilha. Tente novamente.";
  } finally {
    // Reativa o botão
    btnBoarding.disabled = false;
    btnBoarding.style.opacity = "1";
  }
});