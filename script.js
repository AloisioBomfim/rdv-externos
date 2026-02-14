/* ========================================
   SCRIPT.JS - Funções JavaScript Consolidadas
   ======================================== */

// ========== AUTO-RESIZE DE TEXTAREAS ==========

// Inicializar auto-resize para textareas
function inicializarAutoResizeTextarea() {
    const textareas = document.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
        // Ajustar altura inicial
        ajustarAlturaTextarea(textarea);
        
        // Ajustar ao digitar
        textarea.addEventListener('input', function() {
            ajustarAlturaTextarea(this);
        });
        
        // Ajustar ao mudar conteúdo via JavaScript
        textarea.addEventListener('change', function() {
            ajustarAlturaTextarea(this);
        });
    });
}

// Ajustar altura de um textarea específico
function ajustarAlturaTextarea(textarea) {
    // Reset da altura para calcular o scrollHeight corretamente
    textarea.style.height = 'auto';
    textarea.style.overflowY = 'hidden';
    
    // Calcular nova altura (com mínimo de 80px e máximo de 600px)
    const novaAltura = Math.min(Math.max(textarea.scrollHeight, 80), 600);
    textarea.style.height = novaAltura + 'px';
    // Mostrar barra de rolagem vertical caso o conteúdo exceda a altura máxima
    textarea.style.overflowY = (novaAltura >= 600) ? 'auto' : 'hidden';
}

// ========== CONFIGURAÇÃO INICIAL ===========
const VALOR_HORA_PADRAO = 100.00;
const VALOR_DESLOCAMENTO = 50.00;
const VALOR_BONIFICACAO = 75.00;

// ========== EVENTOS ==========

// Carregar dados ao abrir a página
window.addEventListener('DOMContentLoaded', function() {
    // Inicializar auto-resize para todos os textareas
    inicializarAutoResizeTextarea();
    
    // Verificar se estamos na página de horas
    if (document.getElementById('horasForm')) {
        carregarDados();
        preencherMesAtual();
        if (document.getElementById('tableBody').children.length === 0) {
            preencherDiasUteis();
        }
        
        // Adicionar evento ao campo de valor hora técnica
        const valorHoraTecnica = document.getElementById('valorHoraTecnica');
        if (valorHoraTecnica) {
            valorHoraTecnica.addEventListener('change', function() {
                validarMoeda(this);
                atualizarTotais();
            });
        }
        
        // Associar event listeners aos botões
        document.querySelectorAll('[data-action="adicionarLinha"]').forEach(btn => {
            btn.addEventListener('click', adicionarLinha);
        });
        
        document.querySelectorAll('[data-action="preencherDiasUteis"]').forEach(btn => {
            btn.addEventListener('click', preencherDiasUteis);
        });
        
        document.querySelectorAll('[data-action="salvarDados"]').forEach(btn => {
            btn.addEventListener('click', salvarDados);
        });
        
        document.querySelectorAll('[data-action="exportarJSON"]').forEach(btn => {
            btn.addEventListener('click', exportarJSON);
        });
        
        document.querySelectorAll('[data-action="exportarCSV"]').forEach(btn => {
            btn.addEventListener('click', exportarCSV);
        });
        
        document.querySelectorAll('[data-action="imprimirRelatorio"]').forEach(btn => {
            btn.addEventListener('click', imprimirRelatorio);
        });
        
        document.querySelectorAll('[data-action="limparFormulario"]').forEach(btn => {
            btn.addEventListener('click', limparFormulario);
        });
    }
});

// ========== FORMULÁRIO DE HORAS ==========

// Definir mês/ano atual
function preencherMesAtual() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    document.getElementById('mesPeriodo').value = `${ano}-${mes}`;
}

// Adicionar nova linha à tabela
function adicionarLinha(data = '') {
    const tbody = document.getElementById('tableBody');
    const rowId = 'row-' + Date.now();
    
    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.innerHTML = `
        <td><input type="date" class="data-input" value="${data}" onchange="calcularLinha('${rowId}')" onkeydown="navegarComEnter(event, '${rowId}')"></td>
        <td><input type="text" class="entrada-input" placeholder="HH:MM" maxlength="5" onchange="validarHora(this); calcularLinha('${rowId}')" onkeypress="return /[0-9:]/.test(event.key)" onkeydown="navegarComEnter(event, '${rowId}')"></td>
        <td><input type="text" class="saida-input" placeholder="HH:MM" maxlength="5" onchange="validarHora(this); calcularLinha('${rowId}')" onkeypress="return /[0-9:]/.test(event.key)" onkeydown="navegarComEnter(event, '${rowId}')"></td>
        <td><input type="text" class="intervalo-input" placeholder="HH:MM" value="01:00" maxlength="5" onchange="validarHora(this); calcularLinha('${rowId}')" onkeypress="return /[0-9:]/.test(event.key)" onkeydown="navegarComEnter(event, '${rowId}')"></td>
        <td><input type="text" class="total-horas-input" readonly style="background-color: #e8e8e8;"></td>
        <td><input type="text" class="valor-input" readonly style="background-color: #e8e8e8;" placeholder="R$ 0,00"></td>
        <td><input type="text" class="deslocamento-input" placeholder="HH:MM" value="00:00" maxlength="5" onchange="validarHora(this); calcularLinha('${rowId}')" onkeypress="return /[0-9:]/.test(event.key)" onkeydown="navegarComEnter(event, '${rowId}')"></td>
        <td><input type="text" class="bonificacao-input" placeholder="HH:MM" value="00:00" maxlength="5" onchange="validarHora(this); calcularLinha('${rowId}')" onkeypress="return /[0-9:]/.test(event.key)" onkeydown="navegarComEnter(event, '${rowId}')"></td>
        <td><input type="text" class="valor-bonif-input" readonly style="background-color: #e8e8e8;" placeholder="R$ 0,00"></td>
        <td><button type="button" class="btn btn-danger" onclick="removerLinha('${rowId}')">✕</button></td>
    `;
    
    tbody.appendChild(tr);
    atualizarTotais();
}

// Remover linha
function removerLinha(rowId) {
    if (document.getElementById('tableBody').children.length <= 1) {
        alert('Você deve manter pelo menos um registro.');
        return;
    }
    document.getElementById(rowId).remove();
    atualizarTotais();
}

// ========== VALIDAÇÃO ==========

// Validar e formatar horas (HH:MM)
function validarHora(input) {
    let valor = input.value.replace(/[^0-9:]/g, '');
    
    if (valor) {
        const partes = valor.split(':');
        let horas = partes[0] ? parseInt(partes[0]) : 0;
        let minutos = partes[1] ? parseInt(partes[1]) : 0;
        
        horas = Math.min(23, Math.max(0, horas));
        minutos = Math.min(59, Math.max(0, minutos));
        
        input.value = String(horas).padStart(2, '0') + ':' + 
                     String(minutos).padStart(2, '0');
    }
}

// Validar e formatar moeda (R$ 0,00)
function validarMoeda(input) {
    let valor = input.value.replace(/[^0-9,]/g, '');
    valor = valor.replace(',', '.');
    let num = parseFloat(valor) || 0;
    input.value = formatarMoeda(num);
}

// ========== CONVERSÃO DE FORMATOS ==========

// Formatar número como moeda
function formatarMoeda(num) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(num);
}

// Converter hora de texto (HH:MM) para minutos
function horaParaMinutos(horaTexto) {
    if (!horaTexto) return 0;
    const partes = horaTexto.split(':');
    const horas = parseInt(partes[0]) || 0;
    const minutos = parseInt(partes[1]) || 0;
    return horas * 60 + minutos;
}

// Converter minutos para hora (HH:MM)
function minutosParaHora(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    return String(horas).padStart(2, '0') + ':' + 
           String(mins).padStart(2, '0');
}

// Converter moeda de texto para número
function moedaParaNumero(moedaTexto) {
    return parseFloat(moedaTexto.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
}

// Navegar entre campos do formulário com ENTER
function navegarComEnterFormulario(event) {
    if (event.key !== 'Enter') return;
    
    // Para textarea, permite CTRL+ENTER
    if (event.target.tagName === 'TEXTAREA' && !event.ctrlKey) return;
    
    event.preventDefault();
    
    // Ordem dos campos no formulário
    const camposFormulario = [
        'dataVisita',
        'mesPeriodo',
        'nomeAnalista',
        'projeto',
        'valorHoraTecnica',
        'licencaCliente',
        'cidadeEstado',
        'numeroAtendimento',
        'observacoes'
    ];
    
    const idAtual = event.target.id;
    const indiceAtual = camposFormulario.indexOf(idAtual);
    
    // Executar validações/cálculos do campo atual se aplicável
    if (idAtual === 'valorHoraTecnica') {
        validarMoeda(event.target);
        atualizarTotais();
    }
    
    // Próximo campo
    if (indiceAtual !== -1 && indiceAtual < camposFormulario.length - 1) {
        const proximoId = camposFormulario[indiceAtual + 1];
        const proximoCampo = document.getElementById(proximoId);
        if (proximoCampo) {
            proximoCampo.focus();
            if (proximoCampo.type !== 'month' && proximoCampo.type !== 'date') {
                proximoCampo.select();
            }
        }
    }
}

// Navegar entre campos da tabela com ENTER
function navegarComEnter(event, rowId) {
    if (event.key !== 'Enter') return;
    
    event.preventDefault();
    const row = document.getElementById(rowId);
    
    // Ordem dos campos editáveis na tabela
    const camposEditaveis = [
        'data-input',
        'entrada-input',
        'saida-input',
        'intervalo-input',
        'deslocamento-input',
        'bonificacao-input'
    ];
    
    const inputAtual = event.target;
    const classeAtual = camposEditaveis.find(classe => inputAtual.classList.contains(classe));
    const indiceAtual = camposEditaveis.indexOf(classeAtual);
    
    // Executar cálculo do campo atual
    calcularLinha(rowId);
    
    // Próximo campo
    let proximoIndice = (indiceAtual + 1) % camposEditaveis.length;
    const proximoCampo = row.querySelector('.' + camposEditaveis[proximoIndice]);
    
    if (proximoCampo) {
        proximoCampo.focus();
        proximoCampo.select();
    } else if (proximoIndice === 0) {
        // Se for voltar para o primeiro, vai para a próxima linha
        const proximaLinha = row.nextElementSibling;
        if (proximaLinha && proximaLinha.id) {
            const proximoDataInput = proximaLinha.querySelector('.data-input');
            if (proximoDataInput) {
                proximoDataInput.focus();
            }
        }
    }
}

// Converter moeda de texto para número
function moedaParaNumero(moedaTexto) {
    return parseFloat(moedaTexto.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
}

// ========== CÁLCULOS ==========

// Calcular valores de uma linha
function calcularLinha(rowId) {
    const row = document.getElementById(rowId);
    const entrada = row.querySelector('.entrada-input').value;
    const saida = row.querySelector('.saida-input').value;
    const intervaloTexto = row.querySelector('.intervalo-input').value;
    const intervalo = horaParaMinutos(intervaloTexto);
    const deslocamentoTexto = row.querySelector('.deslocamento-input').value;
    const bonificacaoTexto = row.querySelector('.bonificacao-input').value;
    const valorBonifTexto = row.querySelector('.valor-bonif-input').value;
    const valorBonif = moedaParaNumero(valorBonifTexto);

    let totalMinutos = 0;
    
    if (entrada && saida) {
        const minEntrada = horaParaMinutos(entrada);
        const minSaida = horaParaMinutos(saida);
        let diferenca = minSaida - minEntrada;
        
        if (diferenca < 0) diferenca += 24 * 60; // Caso passe para o dia seguinte
        
        diferenca -= intervalo;
        totalMinutos = Math.max(0, diferenca);
    }

    const totalHoras = totalMinutos / 60;
    const totalHorasInput = row.querySelector('.total-horas-input');
    totalHorasInput.value = minutosParaHora(totalMinutos);
    
    // Calcular valor baseado na hora técnica global
    const valorHoraTecnicaTexto = document.getElementById('valorHoraTecnica').value;
    const valorHoraTecnica = moedaParaNumero(valorHoraTecnicaTexto);
    const valorLinha = totalHoras * valorHoraTecnica;
    const valorInput = row.querySelector('.valor-input');
    valorInput.value = formatarMoeda(valorLinha);
    
    // Calcular valor bonificação baseado nas horas de bonificação vezes valor hora técnica
    const bonifMinutos = horaParaMinutos(bonificacaoTexto);
    const bonifHoras = bonifMinutos / 60;
    const valorBonificacao = bonifHoras * valorHoraTecnica;
    const valorBonifInput = row.querySelector('.valor-bonif-input');
    valorBonifInput.value = formatarMoeda(valorBonificacao);
    
    atualizarTotais();
}

// Atualizar totais
function atualizarTotais() {
    const rows = document.querySelectorAll('#tableBody tr');
    
    let totalMinutos = 0;
    let totalValor = 0;
    let totalDeslocamMinutos = 0;
    let totalBonifMinutos = 0;
    let totalValorBonif = 0;

    // Obter valor hora técnica global
    const valorHoraTecnicaTexto = document.getElementById('valorHoraTecnica').value;
    const valorHoraTecnica = moedaParaNumero(valorHoraTecnicaTexto);

    rows.forEach(row => {
        const horasTexto = row.querySelector('.total-horas-input').value;
        const totalMinRow = horaParaMinutos(horasTexto);
        const deslocamTexto = row.querySelector('.deslocamento-input').value;
        const deslocamMinutos = horaParaMinutos(deslocamTexto);
        const bonifTexto = row.querySelector('.bonificacao-input').value;
        const bonifMinutos = horaParaMinutos(bonifTexto);

        totalMinutos += totalMinRow;
        const horasRow = totalMinRow / 60;
        totalValor += horasRow * valorHoraTecnica;
        totalDeslocamMinutos += deslocamMinutos;
        totalBonifMinutos += bonifMinutos;
        // Calcular valor bonificação: horas bonificadas vezes valor hora técnica
        const bonifHoras = bonifMinutos / 60;
        totalValorBonif += bonifHoras * valorHoraTecnica;
    });

    const totalHoras = totalMinutos / 60;

    // Atualizar tabela
    if (document.getElementById('totalHoras')) {
        document.getElementById('totalHoras').textContent = totalHoras.toFixed(2);
        document.getElementById('totalValor').textContent = formatarMoeda(totalValor).replace('R$', '').trim();
        document.getElementById('totalDeslocam').textContent = minutosParaHora(totalDeslocamMinutos);
        document.getElementById('totalBonif').textContent = minutosParaHora(totalBonifMinutos);
        document.getElementById('totalValorBonif').textContent = formatarMoeda(totalValorBonif).replace('R$', '').trim();

        // Atualizar resumo
        document.getElementById('sumTotalHoras').textContent = totalHoras.toFixed(2);
        document.getElementById('sumTotalDeslocam').textContent = minutosParaHora(totalDeslocamMinutos);
        document.getElementById('sumTotalBonif').textContent = minutosParaHora(totalBonifMinutos);
        document.getElementById('sumTotalValor').textContent = formatarMoeda(totalValor).replace('R$', '').trim();
        document.getElementById('sumTotalValorBonif').textContent = formatarMoeda(totalValorBonif).replace('R$', '').trim();
        document.getElementById('sumTotalGeral').textContent = formatarMoeda(totalValor + totalValorBonif).replace('R$', '').trim();
    }
}

// ========== PREENCHIMENTO ==========

// Preencher com dias úteis do mês
function preencherDiasUteis() {
    const mesPeriodo = document.getElementById('mesPeriodo').value;
    if (!mesPeriodo) {
        alert('Selecione um mês primeiro');
        return;
    }

    const [ano, mes] = mesPeriodo.split('-');
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);

    // Limpar tabela
    document.getElementById('tableBody').innerHTML = '';

    // Adicionar dias úteis
    for (let d = new Date(primeiroDia); d <= ultimoDia; d.setDate(d.getDate() + 1)) {
        const diaSemana = d.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) { // Segunda a sexta
            const dataFormatada = d.toISOString().split('T')[0];
            adicionarLinha(dataFormatada);
        }
    }
}

// ========== PERSISTÊNCIA ==========

// Salvar dados localmente
function salvarDados() {
    const formData = new FormData(document.getElementById('horasForm'));
    const dados = {
        dataVisita: formData.get('dataVisita'),
        mesPeriodo: formData.get('mesPeriodo'),
        nomeAnalista: formData.get('nomeAnalista'),
        projeto: formData.get('projeto'),
        valorHoraTecnica: moedaParaNumero(document.getElementById('valorHoraTecnica').value),
        licencaCliente: formData.get('licencaCliente'),
        cidadeEstado: formData.get('cidadeEstado'),
        numeroAtendimento: formData.get('numeroAtendimento'),
        observacoes: formData.get('observacoes'),
        registros: [],
        totais: {
            totalHoras: document.getElementById('sumTotalHoras').textContent,
            totalValor: document.getElementById('sumTotalValor').textContent,
            totalDeslocam: document.getElementById('sumTotalDeslocam').textContent,
            totalBonif: document.getElementById('sumTotalBonif').textContent,
            totalValorBonif: document.getElementById('sumTotalValorBonif').textContent,
            totalGeral: document.getElementById('sumTotalGeral').textContent
        }
    };

    document.querySelectorAll('#tableBody tr').forEach(row => {
        dados.registros.push({
            data: row.querySelector('.data-input').value,
            entrada: row.querySelector('.entrada-input').value,
            saida: row.querySelector('.saida-input').value,
            intervalo: row.querySelector('.intervalo-input').value,
            totalHoras: row.querySelector('.total-horas-input').value,
            valor: moedaParaNumero(row.querySelector('.valor-input').value),
            deslocamento: row.querySelector('.deslocamento-input').value,
            bonificacao: row.querySelector('.bonificacao-input').value,
            valorBonif: moedaParaNumero(row.querySelector('.valor-bonif-input').value)
        });
    });

    localStorage.setItem('horasFormData', JSON.stringify(dados));
    alert('✓ Dados salvos com sucesso!');
}

// Carregar dados do localStorage
function carregarDados() {
    const dados = localStorage.getItem('horasFormData');
    if (!dados) return;

    const obj = JSON.parse(dados);
    
    // Carregar data da visita
    if (obj.dataVisita) {
        document.getElementById('dataVisita').value = obj.dataVisita;
    }
    
    document.getElementById('mesPeriodo').value = obj.mesPeriodo;
    document.getElementById('nomeAnalista').value = obj.nomeAnalista;
    document.getElementById('projeto').value = obj.projeto;
    
    // Carregar valor hora técnica
    if (obj.valorHoraTecnica) {
        document.getElementById('valorHoraTecnica').value = formatarMoeda(obj.valorHoraTecnica);
    }
    
    document.getElementById('licencaCliente').value = obj.licencaCliente;
    document.getElementById('cidadeEstado').value = obj.cidadeEstado;
    document.getElementById('numeroAtendimento').value = obj.numeroAtendimento;
    document.getElementById('observacoes').value = obj.observacoes;

    obj.registros.forEach(reg => {
        adicionarLinha(reg.data);
        const rows = document.querySelectorAll('#tableBody tr');
        const lastRow = rows[rows.length - 1];
        
        lastRow.querySelector('.entrada-input').value = reg.entrada;
        lastRow.querySelector('.saida-input').value = reg.saida;
        lastRow.querySelector('.intervalo-input').value = typeof reg.intervalo === 'string' && reg.intervalo.includes(':') ? reg.intervalo : minutosParaHora(parseFloat(reg.intervalo) || 0);
        lastRow.querySelector('.deslocamento-input').value = typeof reg.deslocamento === 'string' && reg.deslocamento.includes(':') ? reg.deslocamento : minutosParaHora(parseFloat(reg.deslocamento) || 0);
        lastRow.querySelector('.bonificacao-input').value = typeof reg.bonificacao === 'string' && reg.bonificacao.includes(':') ? reg.bonificacao : minutosParaHora(parseFloat(reg.bonificacao) || 0);
        lastRow.querySelector('.valor-bonif-input').value = formatarMoeda(parseFloat(reg.valorBonif) || VALOR_BONIFICACAO);
        
        calcularLinha(lastRow.id);
    });

    atualizarTotais();
    
    // Reajustar textareas após carregar dados
    setTimeout(() => {
        document.querySelectorAll('textarea').forEach(ta => {
            ajustarAlturaTextarea(ta);
        });
    }, 100);
}

// ========== EXPORTAÇÃO ==========

// Exportar JSON
function exportarJSON() {
    salvarDados();
    const dados = localStorage.getItem('horasFormData');
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-horas-${document.getElementById('mesPeriodo').value}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Exportar CSV
function exportarCSV() {
    const mesPeriodo = document.getElementById('mesPeriodo').value;
    const nomeAnalista = document.getElementById('nomeAnalista').value;
    const cliente = document.getElementById('cliente').value;

    let csv = 'Controle de Horas - Relatório Mensal\n';
    csv += `Período: ${mesPeriodo}\n`;
    csv += `Analista: ${nomeAnalista}\n`;
    csv += `Cliente: ${cliente}\n\n`;

    csv += 'Data,Entrada,Saída,Intervalo (HH:MM),Total Horas,Valor (R$),H. Deslocam.,H. Bonif.,V. Bonif. (R$)\n';

    document.querySelectorAll('#tableBody tr').forEach(row => {
        const data = row.querySelector('.data-input').value;
        const entrada = row.querySelector('.entrada-input').value;
        const saida = row.querySelector('.saida-input').value;
        const intervalo = row.querySelector('.intervalo-input').value;
        const totalHoras = row.querySelector('.total-horas-input').value;
        const valor = row.querySelector('.valor-input').value;
        const deslocam = row.querySelector('.deslocamento-input').value;
        const bonif = row.querySelector('.bonificacao-input').value;
        const valorBonif = row.querySelector('.valor-bonif-input').value;

        csv += `"${data}","${entrada}","${saida}","${intervalo}","${totalHoras}","${valor}","${deslocam}","${bonif}","${valorBonif}"\n`;
    });

    csv += `\nTOTAIS\n`;
    csv += `Total Horas,${document.getElementById('sumTotalHoras').textContent}\n`;
    csv += `Total Valor,R$ ${document.getElementById('sumTotalValor').textContent}\n`;
    csv += `Total Deslocamento,${document.getElementById('sumTotalDeslocam').textContent}\n`;
    csv += `Total Bonificação,${document.getElementById('sumTotalBonif').textContent}\n`;
    csv += `Valor Bonificação,R$ ${document.getElementById('sumTotalValorBonif').textContent}\n`;
    csv += `Total Geral,R$ ${document.getElementById('sumTotalGeral').textContent}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-horas-${mesPeriodo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Imprimir
function imprimirRelatorio() {
    window.print();
}

// Limpar formulário
function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar todos os dados?')) {
        localStorage.removeItem('horasFormData');
        document.getElementById('horasForm').reset();
        document.getElementById('tableBody').innerHTML = '';
        preencherMesAtual();
        preencherDiasUteis();
    }
}

// Substitui textareas por blocos de texto antes da impressão para permitir quebra de página correta
function preparePrintReplaceTextareas() {
    document.querySelectorAll('textarea').forEach(textarea => {
        // Não processar textareas que já estejam ocultas
        if (textarea.offsetParent === null) return;

        const div = document.createElement('div');
        div.className = 'print-textarea';
        // preservar valor com quebras de linha
        div.textContent = textarea.value || '';

        // copiar estilos essenciais para manter aparência no print
        const cs = window.getComputedStyle(textarea);
        div.style.font = cs.font;
        div.style.fontSize = cs.fontSize;
        div.style.lineHeight = cs.lineHeight;
        div.style.width = cs.width;
        div.style.padding = cs.padding;
        div.style.margin = cs.margin;
        div.style.boxSizing = 'border-box';

        // esconder textarea e inserir o bloco de texto logo após ele
        textarea.style.display = 'none';
        textarea.parentNode.insertBefore(div, textarea.nextSibling);

        // permitir quebras dentro dos contêineres pais quando o conteúdo for longo
        const formGroup = textarea.closest('.form-group');
        if (formGroup) formGroup.classList.add('allow-break');
        const formRow = textarea.closest('.form-row');
        if (formRow) formRow.classList.add('allow-break');
        const section = textarea.closest('.section');
        if (section) section.classList.add('allow-break');
    });
}

function restoreTextareasAfterPrint() {
    document.querySelectorAll('.print-textarea').forEach(div => {
        const textarea = div.previousElementSibling;
        if (textarea && textarea.tagName && textarea.tagName.toLowerCase() === 'textarea') {
            textarea.style.display = '';
        }
        if (div.parentNode) div.parentNode.removeChild(div);
    });
    // remover classes que permitiam quebra
    document.querySelectorAll('.allow-break').forEach(el => el.classList.remove('allow-break'));
}

if (window.matchMedia) {
    window.addEventListener('beforeprint', preparePrintReplaceTextareas);
    window.addEventListener('afterprint', restoreTextareasAfterPrint);
} else {
    window.onbeforeprint = preparePrintReplaceTextareas;
    window.onafterprint = restoreTextareasAfterPrint;
}
