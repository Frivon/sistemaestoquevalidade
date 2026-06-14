let supabaseClient;
let html5QrCode = null;
let usuarioAtual = null;

// ==========================
// 📅 DATA LOCAL (YYYY-MM-DD)
// ==========================
function hojeLocal() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// ==========================
// 📅 PARSE DATA
// ==========================
function parseData(data) {
  if (!data) return new Date(0);
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

// ==========================
// 🚀 INIT
// ==========================
window.addEventListener("DOMContentLoaded", async () => {
  try {
    if (!window.supabase) throw new Error("Supabase SDK não carregou");

    const { createClient } = window.supabase;

    supabaseClient = createClient(
      "https://lpigpstbwtoeaenewzkz.supabase.co",
      "sb_publishable_uKJCAZ3hTCsE4TnCeDs1lg_zFcbrk_S"
    );

    console.log("✅ Supabase conectado");

    // Botões de login
    document.getElementById("btnLogin").addEventListener("click", fazerLogin);
    document.getElementById("btnCadastrar")?.addEventListener("click", fazerCadastro);

    // Enter no campo senha = login
    document.getElementById("loginSenha").addEventListener("keydown", (e) => {
      if (e.key === "Enter") fazerLogin();
    });

    // Verificar se já está logado
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      usuarioAtual = session.user;
      mostrarSistema();
    }

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// ==========================
// 🔐 LOGIN
// ==========================
async function fazerLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const erroDiv = document.getElementById("loginErro");

  if (!email || !senha) {
    erroDiv.textContent = "Preencha email e senha!";
    erroDiv.style.display = "block";
    return;
  }

  erroDiv.style.display = "none";

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    erroDiv.textContent = error.message === "Invalid login credentials"
      ? "Email ou senha incorretos!"
      : error.message;
    erroDiv.style.display = "block";
    return;
  }

  usuarioAtual = data.user;
  mostrarSistema();
}

// ==========================
// 📝 CADASTRO
// ==========================
async function fazerCadastro() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const nome = document.getElementById("loginNome")?.value?.trim();
  const erroDiv = document.getElementById("loginErro");

  console.log("📝 Tentando cadastrar:", email);

  if (!email || !senha) {
    erroDiv.textContent = "Preencha email e senha!";
    erroDiv.style.display = "block";
    return;
  }

  if (senha.length < 6) {
    erroDiv.textContent = "A senha deve ter pelo menos 6 caracteres!";
    erroDiv.style.display = "block";
    return;
  }

  erroDiv.style.display = "none";

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome_estabelecimento: nome || "" }
      }
    });

    console.log("Resposta signUp:", data, error);

    if (error) {
      erroDiv.textContent = error.message;
      erroDiv.style.display = "block";
      return;
    }

    // Verificar se precisa confirmar email
    if (data.user && !data.session) {
      erroDiv.style.display = "block";
      erroDiv.style.borderColor = "rgba(16, 185, 129, 0.3)";
      erroDiv.style.background = "rgba(16, 185, 129, 0.1)";
      erroDiv.style.color = "#34d399";
      erroDiv.textContent = "Conta criada! Verifique seu email para confirmar. Depois faça login.";
      return;
    }

    // Login automático após cadastro
    if (data.session) {
      usuarioAtual = data.user;
      mostrarSistema();
    }
  } catch (err) {
    console.error("Erro no cadastro:", err);
    erroDiv.textContent = "Erro ao criar conta: " + err.message;
    erroDiv.style.display = "block";
  }
}

// ==========================
// 🔑 RECUPERAR SENHA
// ==========================
async function recuperarSenha() {
  const email = document.getElementById("loginEmail").value.trim();
  const erroDiv = document.getElementById("loginErro");

  if (!email) {
    erroDiv.textContent = "Digite seu email primeiro!";
    erroDiv.style.display = "block";
    erroDiv.style.borderColor = "rgba(239, 68, 68, 0.3)";
    erroDiv.style.background = "rgba(239, 68, 68, 0.1)";
    erroDiv.style.color = "#f87171";
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);

  if (error) {
    erroDiv.textContent = error.message;
    erroDiv.style.display = "block";
    return;
  }

  erroDiv.style.display = "block";
  erroDiv.style.borderColor = "rgba(16, 185, 129, 0.3)";
  erroDiv.style.background = "rgba(16, 185, 129, 0.1)";
  erroDiv.style.color = "#34d399";
  erroDiv.textContent = "Email de recuperação enviado! Verifique sua caixa de entrada.";
}

// ==========================
// 🔄 TOGGLE LOGIN/CADASTRO
// ==========================
let modoCadastro = false;

function toggleLoginCadastro() {
  modoCadastro = !modoCadastro;
  const areaCadastro = document.getElementById("areaCadastro");
  const toggleTexto = document.getElementById("toggleTexto");
  const toggleLink = document.getElementById("toggleLink");
  const btnLogin = document.getElementById("btnLogin");
  const erroDiv = document.getElementById("loginErro");

  erroDiv.style.display = "none";

  if (modoCadastro) {
    areaCadastro.style.display = "block";
    btnLogin.style.display = "none";
    toggleTexto.textContent = "Já tem conta? ";
    toggleLink.textContent = "Fazer login";
  } else {
    areaCadastro.style.display = "none";
    btnLogin.style.display = "block";
    toggleTexto.textContent = "Não tem conta? ";
    toggleLink.textContent = "Criar conta";
  }
}

// ==========================
// 🚪 LOGOUT
// ==========================
async function fazerLogout() {
  await supabaseClient.auth.signOut();
  usuarioAtual = null;
  document.getElementById("telaLogin").style.display = "flex";
  document.getElementById("sistemaPrincipal").style.display = "none";
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginSenha").value = "";
  document.getElementById("loginErro").style.display = "none";
}

// ==========================
// 🏪 CARREGAR MERCADOS DO USUÁRIO
// ==========================
async function carregarMercadosDoUsuario() {
  const { data, error } = await supabaseClient
    .from("usuario_mercados")
    .select("mercado")
    .eq("user_id", usuarioAtual.id);

  const seletor = document.getElementById("seletorMercado");
  seletor.innerHTML = "";

  if (!error && data && data.length > 0) {
    if (data.length > 1) {
      seletor.innerHTML += '<option value="">Todos os mercados</option>';
    }
    data.forEach(m => {
      seletor.innerHTML += `<option value="${m.mercado}">${m.mercado}</option>`;
    });
  } else {
    seletor.innerHTML = '<option value="">Nenhum mercado associado</option>';
  }
}

// ==========================
// 🖥️ MOSTRAR SISTEMA
// ==========================
async function mostrarSistema() {
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("sistemaPrincipal").style.display = "block";
  document.getElementById("usuarioEmail").textContent = usuarioAtual.email;

  // Carregar mercados do usuário
  await carregarMercadosDoUsuario();

  // Inicializar botões do sistema
  document.getElementById("btnSalvar").addEventListener("click", salvarProduto);
  document.getElementById("btnAtualizar").addEventListener("click", atualizarProduto);
  document.getElementById("btnScanner").addEventListener("click", iniciarScanner);
  document.getElementById("btnPararScanner")?.addEventListener("click", pararScanner);
  document.getElementById("seletorMercado")?.addEventListener("change", carregarProdutos);

  // Auto-busca ao digitar código de barras
  const inputCodigo = document.getElementById("codigoBarras");
  let timerBusca = null;
  inputCodigo.addEventListener("input", () => {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => buscarPorCodigo(inputCodigo.value.trim()), 500);
  });

  carregarProdutos();
}

// ==========================
// 🔍 BUSCAR PRODUTO POR CÓDIGO DE BARRAS
// ==========================
async function buscarPorCodigo(codigo) {
  if (!codigo || codigo.length < 3) return;

  const inputNome = document.getElementById("nome");
  const inputFornecedor = document.getElementById("fornecedor");

  // 1. Buscar no catálogo primeiro
  const { data: catalogo } = await supabaseClient
    .from("catalogo_produtos")
    .select("nome, fornecedor")
    .eq("codigo_barras", codigo)
    .limit(1);

  if (catalogo && catalogo.length > 0) {
    inputNome.value = catalogo[0].nome;
    inputFornecedor.value = catalogo[0].fornecedor || "";
    inputNome.style.borderColor = "#10b981";
    inputFornecedor.style.borderColor = catalogo[0].fornecedor ? "#10b981" : "";
    setTimeout(() => { inputNome.style.borderColor = ""; inputFornecedor.style.borderColor = ""; }, 2000);
    console.log("✅ Encontrado no catálogo:", catalogo[0].nome);
    return;
  }

  // 2. Se não achou no catálogo, buscar em produtos existentes
  const { data: produtos } = await supabaseClient
    .from("produtos")
    .select("nome, fornecedor")
    .eq("codigo_barras", codigo)
    .limit(1);

  if (produtos && produtos.length > 0) {
    inputNome.value = produtos[0].nome;
    inputFornecedor.value = produtos[0].fornecedor || "";
    inputNome.style.borderColor = "#10b981";
    setTimeout(() => { inputNome.style.borderColor = ""; }, 2000);
    console.log("✅ Encontrado em produtos:", produtos[0].nome);
    return;
  }

  // 3. Não encontrou em nenhum lugar
  inputNome.value = "";
  inputFornecedor.value = "";
  console.log("ℹ️ Código não encontrado, preencha manualmente");
}

// ==========================
// 📷 SCANNER
// ==========================
function iniciarScanner() {

  if (html5QrCode) {
    alert("Scanner já está aberto.");
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      (decodedText) => {
        document.getElementById("codigoBarras").value = decodedText;
        buscarPorCodigo(decodedText.trim());
        pararScanner();
      }
    );
}

// ==========================
// ⛔ PARAR SCANNER
// ==========================
function pararScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
      console.log("Scanner parado");
    });
  }
}

// ==========================
// 💾 SALVAR
// ==========================
async function salvarProduto() {
  const codigo_barras = document.getElementById("codigoBarras")?.value?.trim();
  const nome = document.getElementById("nome")?.value?.trim();
  const fornecedor = document.getElementById("fornecedor")?.value?.trim();
  const lote = document.getElementById("lote")?.value?.trim();
  const quantidade = document.getElementById("quantidade")?.value;
  const validade = document.getElementById("validade")?.value;
  const mercado = document.getElementById("seletorMercado")?.value;

  if (!codigo_barras || !nome || !lote || !validade) {
    alert("Preencha todos os campos!");
    return;
  }

  if (!mercado) {
    alert("Selecione um mercado antes de salvar!");
    return;
  }

  const { error } = await supabaseClient
    .from("produtos")
    .insert([{
      codigo_barras,
      nome,
      fornecedor,
      mercado,
      lote,
      quantidade,
      data_entrada: hojeLocal(),
      data_validade: validade,
      user_id: usuarioAtual.id
    }]);

  if (error) return alert(error.message);

  limparFormulario();
  carregarProdutos();
}

// ==========================
// ✏️ ATUALIZAR
// ==========================
async function atualizarProduto() {
  const id = document.getElementById("editId")?.value;

  if (!id) return alert("Selecione um produto!");

  const codigo_barras = document.getElementById("editCodigoBarras")?.value?.trim();
  const lote = document.getElementById("editLote")?.value?.trim();
  const validade = document.getElementById("editValidade")?.value;

  const { data, error } = await supabaseClient
    .from("produtos")
    .update({
      codigo_barras,
      lote,
      data_validade: validade
    })
    .eq("id", id)
    .select();

  if (error) return alert(error.message);

  if (!data || data.length === 0) {
    alert("Nenhum registro foi atualizado. Verifique as políticas RLS no Supabase.");
    return;
  }

  alert("Produto atualizado com sucesso!");
  carregarProdutos();
}

// ==========================
// 📦 LISTAR + ALERTAS + DASHBOARD
// ==========================
async function carregarProdutos() {

  const mercadoSelecionado = document.getElementById("seletorMercado")?.value || "";

  let query = supabaseClient
    .from("produtos")
    .select("*")
    .order("data_validade", { ascending: true });

  if (mercadoSelecionado) {
    query = query.eq("mercado", mercadoSelecionado);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  const lista = document.getElementById("lista");
  const alertas = document.getElementById("alertas");

  lista.innerHTML = "";

  let vencidos = 0;
  let criticos = 0;
  let ok = 0;

  const listaVencidos = [];
  const listaCriticos = [];
  const listaOk = [];

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  data.forEach(prod => {

    if (!prod.data_validade) return;

    const validade = parseData(prod.data_validade);
    validade.setHours(0, 0, 0, 0);

    const diff = Math.floor(
      (validade - hoje) / 86400000
    );

    const dataFmt = prod.data_validade.split("-").reverse().join("/");

    if (diff < 0) {
      vencidos++;
      listaVencidos.push({ nome: prod.nome, fornecedor: prod.fornecedor || "-", lote: prod.lote || "-", validade: dataFmt, dias: Math.abs(diff) });
    } else if (diff <= 25) {
      criticos++;
      listaCriticos.push({ nome: prod.nome, fornecedor: prod.fornecedor || "-", lote: prod.lote || "-", validade: dataFmt, dias: diff });
    } else {
      ok++;
      listaOk.push({ nome: prod.nome, fornecedor: prod.fornecedor || "-", lote: prod.lote || "-", validade: dataFmt, dias: diff });
    }

    let bordaCor = "rgba(16, 185, 129, 0.3)";
    let bgCor = "#1f2937";
    let indicador = "#10b981";

    if (diff < 0) {
      bordaCor = "rgba(239, 68, 68, 0.3)";
      indicador = "#ef4444";
    } else if (diff <= 25) {
      bordaCor = "rgba(245, 158, 11, 0.3)";
      indicador = "#f59e0b";
    }

    const dataFormatada =
      prod.data_validade.split("-").reverse().join("/");

    lista.innerHTML += `
      <div class="card" style="background:${bgCor}; border-color:${bordaCor}; border-left: 3px solid ${indicador}">
        <strong>${prod.nome}</strong>

        <span class="label">Fornecedor:</span> ${prod.fornecedor || "-"}<br>

        <span class="label">Mercado:</span> ${prod.mercado || "-"}<br>

        <span class="label">Código:</span> ${prod.codigo_barras || "-"}<br>

        <span class="label">Lote:</span> ${prod.lote || "-"}<br>

        <span class="label">Qtd:</span> ${prod.quantidade || 0}<br>

        <span class="label">Validade:</span> ${dataFormatada}<br>

        <button
          class="btn btn-blue"
          style="margin-top:10px"
          data-id="${prod.id}"
          data-codigo="${prod.codigo_barras || ""}"
          data-lote="${prod.lote || ""}"
          data-validade="${prod.data_validade || ""}"
          onclick="abrirEdicao(this)">
          ✏️ Editar
        </button>

        <button
          class="btn btn-red"
          style="margin-top:10px; margin-left:6px"
          onclick="excluirProduto('${prod.id}', '${prod.nome}')">
          🗑️ Excluir
        </button>
      </div>
    `;
  });

  // ==========================
  // 🔔 ALERTAS (clicáveis com resumo)
  // ==========================

  function gerarResumo(items, tipo) {
    if (items.length === 0) return '<div style="padding:8px 0; color:#6b7280; font-size:13px">Nenhum produto nesta categoria.</div>';
    return items.map(p => {
      let detalhe = "";
      if (tipo === "vencido") detalhe = `<span style="color:#ef4444">venceu há ${p.dias} dia(s)</span>`;
      else if (tipo === "critico") detalhe = p.dias === 0 ? `<span style="color:#f59e0b">vence hoje!</span>` : `<span style="color:#f59e0b">vence em ${p.dias} dia(s)</span>`;
      else detalhe = `<span style="color:#10b981">${p.dias} dia(s) restantes</span>`;
      return `<div style="padding:6px 12px; background:#111827; border-radius:8px; margin-top:6px; font-size:13px; display:flex; justify-content:space-between; align-items:center">
        <div><strong style="color:#e5e7eb">${p.nome}</strong> <span style="color:#6b7280">· Forn: ${p.fornecedor} · Lote: ${p.lote} · Val: ${p.validade}</span></div>
        <div>${detalhe}</div>
      </div>`;
    }).join("");
  }

  alertas.innerHTML = `
    <div class="space-y-3">

      <div style="background:#1f2937; border:1.5px solid rgba(239,68,68,0.25); border-left:3px solid #ef4444; cursor:pointer" class="p-4 rounded-xl" onclick="toggleResumo('resumoVencidos')">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span>❌ Vencidos: <strong style="color:#ef4444">${vencidos}</strong></span>
          <span style="color:#6b7280; font-size:12px">▼ clique para ver</span>
        </div>
        <div id="resumoVencidos" style="display:none; margin-top:8px">
          ${gerarResumo(listaVencidos, "vencido")}
        </div>
      </div>

      <div style="background:#1f2937; border:1.5px solid rgba(245,158,11,0.25); border-left:3px solid #f59e0b; cursor:pointer" class="p-4 rounded-xl" onclick="toggleResumo('resumoCriticos')">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span>⚠️ Críticos: <strong style="color:#f59e0b">${criticos}</strong></span>
          <span style="color:#6b7280; font-size:12px">▼ clique para ver</span>
        </div>
        <div id="resumoCriticos" style="display:none; margin-top:8px">
          ${gerarResumo(listaCriticos, "critico")}
        </div>
      </div>

      <div style="background:#1f2937; border:1.5px solid rgba(16,185,129,0.25); border-left:3px solid #10b981; cursor:pointer" class="p-4 rounded-xl" onclick="toggleResumo('resumoOk')">
        <div style="display:flex; justify-content:space-between; align-items:center">
          <span>✅ OK: <strong style="color:#10b981">${ok}</strong></span>
          <span style="color:#6b7280; font-size:12px">▼ clique para ver</span>
        </div>
        <div id="resumoOk" style="display:none; margin-top:8px">
          ${gerarResumo(listaOk, "ok")}
        </div>
      </div>

    </div>
  `;

  // ==========================
  // 📊 DASHBOARD
  // ==========================
  document.getElementById("totalProdutos").textContent =
    data.length;

  document.getElementById("vencidos").textContent =
    vencidos;

  document.getElementById("alerta").textContent =
    criticos;

  document.getElementById("ok").textContent =
    ok;
}

// ==========================
// ✏️ EDITAR
// ==========================
function abrirEdicao(btn) {
  document.getElementById("editId").value = btn.dataset.id;
  document.getElementById("editCodigoBarras").value = btn.dataset.codigo;
  document.getElementById("editLote").value = btn.dataset.lote;
  document.getElementById("editValidade").value = btn.dataset.validade;
}

// ==========================
// 🧹 LIMPAR
// ==========================
function limparFormulario() {
  ["codigoBarras","nome","fornecedor","lote","quantidade","validade"]
    .forEach(id => document.getElementById(id).value = "");
}

// ==========================
// 📊 EXPORTAR CSV
// ==========================
async function exportarCSV() {
  const mercadoSelecionado = document.getElementById("seletorMercado")?.value || "";

  let query = supabaseClient
    .from("produtos")
    .select("*")
    .order("data_validade", { ascending: true });

  if (mercadoSelecionado) {
    query = query.eq("mercado", mercadoSelecionado);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    alert("Nenhum produto para exportar!");
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let csv = "Nome,Fornecedor,Mercado,Código de Barras,Lote,Quantidade,Validade,Status\n";

  data.forEach(prod => {
    const validade = parseData(prod.data_validade);
    validade.setHours(0, 0, 0, 0);
    const diff = Math.floor((validade - hoje) / 86400000);

    let status = "OK";
    if (diff < 0) status = "VENCIDO";
    else if (diff <= 25) status = "CRÍTICO";

    const dataFmt = prod.data_validade ? prod.data_validade.split("-").reverse().join("/") : "-";

    csv += `"${prod.nome || ""}","${prod.fornecedor || ""}","${prod.mercado || ""}","${prod.codigo_barras || ""}","${prod.lote || ""}","${prod.quantidade || 0}","${dataFmt}","${status}"\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `estoque_${mercadoSelecionado || "todos"}_${hojeLocal()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ==========================
// 🔍 FILTRAR PRODUTOS NA LISTA
// ==========================
function filtrarProdutos() {
  const busca = document.getElementById("buscaProduto").value.toLowerCase();
  const cards = document.querySelectorAll("#lista .card");

  cards.forEach(card => {
    const texto = card.textContent.toLowerCase();
    card.style.display = texto.includes(busca) ? "" : "none";
  });
}

// ==========================
// 🗑️ EXCLUIR PRODUTO
// ==========================
async function excluirProduto(id, nome) {
  if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;

  const { error } = await supabaseClient
    .from("produtos")
    .delete()
    .eq("id", id);

  if (error) return alert("Erro ao excluir: " + error.message);

  alert("Produto excluído com sucesso!");
  carregarProdutos();
}

// ==========================
// 🔽 TOGGLE RESUMO ALERTAS
// ==========================
function toggleResumo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}
