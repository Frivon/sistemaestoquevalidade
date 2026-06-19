let supabaseClient;
let html5QrCode = null;
let usuarioAtual = null;
let usuarioEditandoId = null;

function hojeLocal() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function parseData(data) {
  if (!data) return new Date(0);
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

window.addEventListener("DOMContentLoaded", async () => {
  try {
    if (!window.supabase) throw new Error("Supabase SDK não carregou");
    const { createClient } = window.supabase;
    supabaseClient = createClient(
      "https://lpigpstbwtoeaenewzkz.supabase.co",
      "sb_publishable_uKJCAZ3hTCsE4TnCeDs1lg_zFcbrk_S"
    );
    console.log("✅ Supabase conectado");
    document.getElementById("btnLogin").addEventListener("click", fazerLogin);
    document.getElementById("btnCadastrar")?.addEventListener("click", fazerCadastro);
    document.getElementById("loginSenha").addEventListener("keydown", (e) => {
      if (e.key === "Enter") fazerLogin();
    });
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) { usuarioAtual = session.user; mostrarSistema(); }
  } catch (err) { console.error(err); alert(err.message); }
});

async function fazerLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const erroDiv = document.getElementById("loginErro");
  if (!email || !senha) { erroDiv.textContent = "Preencha email e senha!"; erroDiv.style.display = "block"; return; }
  erroDiv.style.display = "none";
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  if (error) { erroDiv.textContent = error.message === "Invalid login credentials" ? "Email ou senha incorretos!" : error.message; erroDiv.style.display = "block"; return; }
  const isAdmin = email === "wesley.thoy@hotmail.com";
  if (!isAdmin) {
    const { data: perfil } = await supabaseClient.from("perfis").select("aprovado").eq("user_id", data.user.id).limit(1);
    if (!perfil || perfil.length === 0 || !perfil[0].aprovado) {
      await supabaseClient.auth.signOut();
      erroDiv.style.display = "block"; erroDiv.style.borderColor = "rgba(245,158,11,0.3)"; erroDiv.style.background = "rgba(245,158,11,0.1)"; erroDiv.style.color = "#fbbf24";
      erroDiv.textContent = "⏳ Seu cadastro ainda está aguardando aprovação do administrador.";
      return;
    }
  }
  usuarioAtual = data.user; mostrarSistema();
}

async function fazerCadastro() {
  const email = document.getElementById("loginEmail").value.trim();
  const senha = document.getElementById("loginSenha").value;
  const nome = document.getElementById("loginNome")?.value?.trim();
  const mercado = document.getElementById("loginMercado")?.value?.trim();
  const whatsapp = document.getElementById("loginWhatsApp")?.value?.trim() || "";
  const erroDiv = document.getElementById("loginErro");
  if (!email || !senha) { erroDiv.textContent = "Preencha email e senha!"; erroDiv.style.display = "block"; return; }
  if (!nome) { erroDiv.textContent = "Preencha o nome do estabelecimento!"; erroDiv.style.display = "block"; return; }
  if (!mercado) { erroDiv.textContent = "Preencha o nome do mercado!"; erroDiv.style.display = "block"; return; }
  if (senha.length < 6) { erroDiv.textContent = "A senha deve ter pelo menos 6 caracteres!"; erroDiv.style.display = "block"; return; }
  erroDiv.style.display = "none";
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome_estabelecimento: nome || "",
          mercado: mercado || "",
          whatsapp: whatsapp || ""
        }
      }
    });
    if (error) { erroDiv.textContent = error.message; erroDiv.style.display = "block"; return; }
    if (data.user) {
      // Trigger do Supabase insere automaticamente em perfis
      await supabaseClient.auth.signOut();
      erroDiv.style.display = "block"; erroDiv.style.borderColor = "rgba(16,185,129,0.3)"; erroDiv.style.background = "rgba(16,185,129,0.1)"; erroDiv.style.color = "#34d399";
      erroDiv.textContent = "✅ Cadastro enviado! Aguarde a aprovação do administrador para acessar o sistema.";
      return;
    }
  } catch (err) { erroDiv.textContent = "Erro ao criar conta: " + err.message; erroDiv.style.display = "block"; }
}

async function recuperarSenha() {
  const email = document.getElementById("loginEmail").value.trim();
  const erroDiv = document.getElementById("loginErro");
  if (!email) { erroDiv.textContent = "Digite seu email primeiro!"; erroDiv.style.display = "block"; return; }
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  if (error) { erroDiv.textContent = error.message; erroDiv.style.display = "block"; return; }
  erroDiv.style.display = "block"; erroDiv.style.borderColor = "rgba(16,185,129,0.3)"; erroDiv.style.background = "rgba(16,185,129,0.1)"; erroDiv.style.color = "#34d399";
  erroDiv.textContent = "Email de recuperação enviado! Verifique sua caixa de entrada.";
}

let modoCadastro = false;
function toggleLoginCadastro() {
  modoCadastro = !modoCadastro;
  const areaCadastro = document.getElementById("areaCadastro");
  const toggleTexto = document.getElementById("toggleTexto");
  const toggleLink = document.getElementById("toggleLink");
  const btnLogin = document.getElementById("btnLogin");
  const erroDiv = document.getElementById("loginErro");
  erroDiv.style.display = "none";
  if (modoCadastro) { areaCadastro.style.display = "block"; btnLogin.style.display = "none"; toggleTexto.textContent = "Já tem conta? "; toggleLink.textContent = "Fazer login"; }
  else { areaCadastro.style.display = "none"; btnLogin.style.display = "block"; toggleTexto.textContent = "Não tem conta? "; toggleLink.textContent = "Criar conta"; }
}

async function fazerLogout() {
  await supabaseClient.auth.signOut(); usuarioAtual = null;
  document.getElementById("telaLogin").style.display = "flex";
  document.getElementById("sistemaPrincipal").style.display = "none";
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginSenha").value = "";
  document.getElementById("loginErro").style.display = "none";
  document.getElementById("painelConfiguracoes").style.display = "none";
}

function toggleConfiguracoes() {
  const painel = document.getElementById("painelConfiguracoes");
  if (painel.style.display === "none") {
    document.getElementById("configEmailAtual").value = usuarioAtual?.email || "";
    document.getElementById("configEmailNovo").value = "";
    document.getElementById("configError").style.display = "none";
    document.getElementById("configSuccess").style.display = "none";
    painel.style.display = "block";
  } else {
    painel.style.display = "none";
  }
}

async function atualizarEmailUsuario() {
  const novoEmail = document.getElementById("configEmailNovo").value.trim().toLowerCase();
  const erroDiv = document.getElementById("configError");
  const sucessoDiv = document.getElementById("configSuccess");
  erroDiv.style.display = "none";
  sucessoDiv.style.display = "none";

  if (!novoEmail) { erroDiv.textContent = "Digite o novo email."; erroDiv.style.display = "block"; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) { erroDiv.textContent = "Email inválido."; erroDiv.style.display = "block"; return; }
  if (novoEmail === usuarioAtual?.email) { erroDiv.textContent = "O novo email é igual ao atual."; erroDiv.style.display = "block"; return; }

  const btn = document.querySelector('#painelConfiguracoes .btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Enviando..."; btn.disabled = true;

  try {
    // 1. Atualiza email no auth.users — envia confirmação ao novo email
    const { data, error: authError } = await supabaseClient.auth.updateUser({ email: novoEmail });
    if (authError) throw authError;

    // 2. Atualiza email na tabela public.perfis
    const { error: perfilError } = await supabaseClient.from("perfis").update({ email: novoEmail }).eq("user_id", usuarioAtual.id);
    if (perfilError) throw perfilError;

    sucessoDiv.textContent = "✅ Email atualizado! Verifique o novo email e confirme o link recebido. Depois, faça login novamente.";
    sucessoDiv.style.display = "block";
    document.getElementById("configEmailNovo").value = "";
  } catch (err) {
    erroDiv.textContent = "❌ " + (err.message || "Erro ao atualizar email. Tente novamente.");
    erroDiv.style.display = "block";
  } finally {
    btn.innerHTML = originalText; btn.disabled = false;
  }
}

let mercadoDoUsuario = "";
async function carregarMercadoDoUsuario() {
  const { data, error } = await supabaseClient.from("usuario_mercados").select("mercado").eq("user_id", usuarioAtual.id).limit(1);
  if (!error && data && data.length > 0) mercadoDoUsuario = data[0].mercado; else mercadoDoUsuario = "";
}

async function mostrarSistema() {
  document.getElementById("telaLogin").style.display = "none";
  document.getElementById("sistemaPrincipal").style.display = "block";
  document.getElementById("usuarioEmail").textContent = usuarioAtual.email;
  const isAdmin = usuarioAtual.email === "wesley.thoy@hotmail.com";
  document.getElementById("btnConfig").style.display = isAdmin ? "inline-block" : "none";
  document.getElementById("painelConfiguracoes").style.display = "none";
  const areaAdmin = document.getElementById("areaAdmin");
  const areaProdutos = document.getElementById("areaProdutos");
  if (isAdmin) { areaAdmin.style.display = "block"; areaProdutos.style.display = "none"; carregarPendentes(); carregarClientesAtivos(); }
  else {
    areaAdmin.style.display = "none"; areaProdutos.style.display = "block";
    await carregarMercadoDoUsuario();
    document.getElementById("btnSalvar").addEventListener("click", salvarProduto);
    document.getElementById("btnAtualizar").addEventListener("click", atualizarProduto);
    document.getElementById("btnScanner").addEventListener("click", iniciarScanner);
    document.getElementById("btnPararScanner")?.addEventListener("click", pararScanner);
    const inputCodigo = document.getElementById("codigoBarras");
    let timerBusca = null;
    inputCodigo.addEventListener("input", () => { clearTimeout(timerBusca); timerBusca = setTimeout(() => buscarPorCodigo(inputCodigo.value.trim()), 500); });
    carregarProdutos();
  }
}

async function carregarPendentes() {
  const { data, error } = await supabaseClient.from("perfis").select("*").eq("aprovado", false).order("data_cadastro", { ascending: false });
  const lista = document.getElementById("listaPendentes");
  if (error || !data || data.length === 0) { lista.innerHTML = '<div style="color:#6b7280; font-size:14px; padding:8px 0">Nenhum cadastro pendente. ✅</div>'; return; }
  const userIds = data.map(p => p.user_id);
  const { data: mercados } = await supabaseClient.from("usuario_mercados").select("user_id").in("user_id", userIds);
  const jaAprovados = new Set((mercados || []).map(m => m.user_id));
  lista.innerHTML = data.map(p => {
    const dataFmt = new Date(p.data_cadastro).toLocaleDateString("pt-BR");
    const foiDesativado = jaAprovados.has(p.user_id);
    return `
      <div style="background:#111827; border:1.5px solid ${foiDesativado ? 'rgba(245,158,11,0.3)' : '#374151'}; border-radius:12px; padding:16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
        <div>
          <strong style="color:#e5e7eb; font-size:15px">${p.nome_estabelecimento || "-"}</strong>
          ${foiDesativado ? '<span style="color:#f59e0b; font-size:11px; margin-left:8px">⚠️ DESATIVADO</span>' : '<span style="color:#3b82f6; font-size:11px; margin-left:8px">🆕 NOVO</span>'}<br>
          <span style="color:#6b7280; font-size:13px">📧 ${p.email}</span><br>
          <span style="color:#6b7280; font-size:13px">🏪 ${p.mercado || "-"}</span><br>
          <span style="color:#6b7280; font-size:12px">📅 ${dataFmt}</span>
        </div>
        <div style="display:flex; gap:8px">
          ${foiDesativado
            ? `<button class="btn btn-green" style="padding:8px 16px; font-size:13px" onclick="reativarCliente('${p.user_id}', '${p.email}')">🔄 Reativar</button>`
            : `<button class="btn btn-green" style="padding:8px 16px; font-size:13px" onclick="aprovarCadastro('${p.user_id}', '${p.email}', '${p.mercado || ""}')">✅ Aprovar</button>`
          }
          <button class="btn btn-red" style="padding:8px 16px; font-size:13px" onclick="rejeitarCadastro('${p.user_id}', '${p.nome_estabelecimento}')">❌ Rejeitar</button>
        </div>
      </div>
    `;
  }).join("");
}

async function aprovarCadastro(userId, email, mercado) {
  if (!confirm(`Aprovar cadastro de ${email}?`)) return;
  const { error: errPerfil } = await supabaseClient.from("perfis").update({ aprovado: true }).eq("user_id", userId);
  if (errPerfil) return alert("Erro ao aprovar: " + errPerfil.message);
  if (mercado) await supabaseClient.from("usuario_mercados").insert([{ user_id: userId, mercado }]);
  alert(`✅ ${email} aprovado com sucesso!`); carregarPendentes();
}

async function rejeitarCadastro(userId, nome) {
  if (!confirm(`Rejeitar e excluir o cadastro de "${nome}"?`)) return;
  const { error: authError } = await supabaseClient.rpc("admin_delete_auth_user", { target_user_id: userId });
  if (authError) { alert("Erro ao remover usuário: " + authError.message); return; }
  alert("✅ Cadastro rejeitado e usuário removido!"); carregarPendentes();
}

async function carregarClientesAtivos() {
  const { data, error } = await supabaseClient.from("perfis").select("*").eq("aprovado", true).order("data_cadastro", { ascending: false });
  const lista = document.getElementById("listaClientesAtivos"); if (!lista) return;
  if (error || !data || data.length === 0) { lista.innerHTML = '<div style="color:#6b7280; font-size:14px; padding:8px 0">Nenhum cliente ativo.</div>'; return; }
  lista.innerHTML = data.map(p => {
    const dataFmt = new Date(p.data_cadastro).toLocaleDateString("pt-BR");
    return `
      <div style="background:#111827; border:1.5px solid rgba(16,185,129,0.25); border-left:3px solid #10b981; border-radius:12px; padding:16px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px">
        <div>
          <strong style="color:#e5e7eb; font-size:15px">${p.nome_estabelecimento || "-"}</strong><br>
          <span style="color:#6b7280; font-size:13px">📧 ${p.email}</span><br>
          <span style="color:#6b7280; font-size:13px">🏪 ${p.mercado || "-"}</span><br>
          <span style="color:#6b7280; font-size:12px">📅 Desde: ${dataFmt}</span>
        </div>
        <div>
          <button class="btn btn-blue" style="padding:8px 16px; font-size:13px; margin-right:6px;" onclick="abrirEdicaoEmail('${p.user_id}', '${p.email}')">✏️ Editar</button>
          <button class="btn btn-red" style="padding:8px 16px; font-size:13px" onclick="desativarCliente('${p.user_id}', '${p.nome_estabelecimento}')">🚫 Desativar</button>
        </div>
      </div>
    `;
  }).join("");
}

async function desativarCliente(userId, nome) {
  if (!confirm(`Desativar o acesso de "${nome}"? O cliente não conseguirá mais logar.`)) return;
  const { error } = await supabaseClient.from("perfis").update({ aprovado: false }).eq("user_id", userId);
  if (error) return alert("Erro ao desativar: " + error.message);
  alert("Cliente desativado."); carregarPendentes(); carregarClientesAtivos();
}

async function reativarCliente(userId, email) {
  if (!confirm(`Reativar o acesso de ${email}?`)) return;
  const { error } = await supabaseClient.from("perfis").update({ aprovado: true }).eq("user_id", userId);
  if (error) return alert("Erro ao reativar: " + error.message);
  alert(`✅ ${email} reativado com sucesso!`); carregarPendentes(); carregarClientesAtivos();
}

async function buscarPorCodigo(codigo) {
  if (!codigo || codigo.length < 3) return;
  const inputNome = document.getElementById("nome");
  const inputFornecedor = document.getElementById("fornecedor");
  const { data: catalogo } = await supabaseClient.from("catalogo_produtos").select("nome, fornecedor").eq("codigo_barras", codigo).limit(1);
  if (catalogo && catalogo.length > 0) {
    inputNome.value = catalogo[0].nome; inputFornecedor.value = catalogo[0].fornecedor || "";
    inputNome.style.borderColor = "#10b981"; inputFornecedor.style.borderColor = catalogo[0].fornecedor ? "#10b981" : "";
    setTimeout(() => { inputNome.style.borderColor = ""; inputFornecedor.style.borderColor = ""; }, 2000);
    console.log("✅ Encontrado no catálogo:", catalogo[0].nome); return;
  }
  const { data: produtos } = await supabaseClient.from("produtos").select("nome, fornecedor").eq("codigo_barras", codigo).limit(1);
  if (produtos && produtos.length > 0) {
    inputNome.value = produtos[0].nome; inputFornecedor.value = produtos[0].fornecedor || "";
    inputNome.style.borderColor = "#10b981"; setTimeout(() => { inputNome.style.borderColor = ""; }, 2000);
    console.log("✅ Encontrado em produtos:", produtos[0].nome); return;
  }
  inputNome.value = ""; inputFornecedor.value = "";
  console.log("ℹ️ Código não encontrado, preencha manualmente");
}

function iniciarScanner() {
  if (html5QrCode) { alert("Scanner já está aberto."); return; }
  html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
    (decodedText) => { document.getElementById("codigoBarras").value = decodedText; buscarPorCodigo(decodedText.trim()); pararScanner(); });
}

function pararScanner() {
  if (html5QrCode) { html5QrCode.stop().then(() => { html5QrCode.clear(); html5QrCode = null; console.log("Scanner parado"); }); }
}

async function salvarProduto() {
  const codigo_barras = document.getElementById("codigoBarras")?.value?.trim();
  const nome = document.getElementById("nome")?.value?.trim();
  const fornecedor = document.getElementById("fornecedor")?.value?.trim();
  const lote = document.getElementById("lote")?.value?.trim();
  const quantidade = document.getElementById("quantidade")?.value;
  const validade = document.getElementById("validade")?.value;
  if (!codigo_barras || !nome || !lote || !validade) { alert("Preencha todos os campos!"); return; }
  const { error } = await supabaseClient.from("produtos").insert([{ codigo_barras, nome, fornecedor, mercado: mercadoDoUsuario, lote, quantidade, data_entrada: hojeLocal(), data_validade: validade, user_id: usuarioAtual.id }]);
  if (error) return alert(error.message);
  try {
    const { data: existente } = await supabaseClient.from("catalogo_produtos").select("id").eq("codigo_barras", codigo_barras).eq("user_id", usuarioAtual.id).limit(1);
    if (existente && existente.length > 0) await supabaseClient.from("catalogo_produtos").update({ nome, fornecedor }).eq("id", existente[0].id);
    else await supabaseClient.from("catalogo_produtos").insert([{ codigo_barras, nome, fornecedor, user_id: usuarioAtual.id }]);
  } catch (err) { console.error("Erro ao atualizar catálogo:", err); }
  limparFormulario(); carregarProdutos();
}

async function atualizarProduto() {
  const id = document.getElementById("editId")?.value;
  if (!id) return alert("Selecione um produto!");
  const codigo_barras = document.getElementById("editCodigoBarras")?.value?.trim();
  const nome = document.getElementById("editNome")?.value?.trim();
  const fornecedor = document.getElementById("editFornecedor")?.value?.trim();
  const lote = document.getElementById("editLote")?.value?.trim();
  const quantidade = document.getElementById("editQuantidade")?.value;
  const mercado = document.getElementById("editMercado")?.value?.trim();
  const validade = document.getElementById("editValidade")?.value;
  const { data, error } = await supabaseClient.from("produtos").update({ codigo_barras, nome, fornecedor, lote, quantidade, mercado, data_validade: validade }).eq("id", id).select();
  if (error) return alert(error.message);
  if (!data || data.length === 0) { alert("Nenhum registro foi atualizado. Verifique as políticas RLS no Supabase."); return; }
  alert("Produto atualizado com sucesso!"); carregarProdutos();
}

async function carregarProdutos() {
  const mercadoSelecionado = mercadoDoUsuario || "";
  let query = supabaseClient.from("produtos").select("*").order("data_validade", { ascending: true });
  if (mercadoSelecionado) query = query.eq("mercado", mercadoSelecionado);
  const { data, error } = await query;
  if (error) { console.error(error); return; }
  const lista = document.getElementById("lista");
  const alertas = document.getElementById("alertas");
  lista.innerHTML = "";
  let vencidos = 0, criticos = 0, ok = 0;
  const listaVencidos = [], listaCriticos = [], listaOk = [];
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  data.forEach(prod => {
    if (!prod.data_validade) return;
    const validade = parseData(prod.data_validade); validade.setHours(0, 0, 0, 0);
    const diff = Math.floor((validade - hoje) / 86400000);
    const dataFmt = prod.data_validade.split("-").reverse().join("/");
    if (diff < 0) { vencidos++; listaVencidos.push({ nome: prod.nome, fornecedor: prod.fornecedor || "-", lote: prod.lote || "-", validade: dataFmt, dias: Math.abs(diff) }); }
    else if (diff <= 25) { criticos++; listaCriticos.push({ nome: prod.nome, fornecedor: prod.fornecedor || "-", lote: prod.lote || "-", validade: dataFmt, dias: diff }); }
    else { ok++; listaOk.push({ nome: prod.nome, fornecedor: prod.fornecedor || "-", lote: prod.lote || "-", validade: dataFmt, dias: diff }); }
    let bordaCor = "rgba(16,185,129,0.3)", indicador = "#10b981";
    if (diff < 0) { bordaCor = "rgba(239,68,68,0.3)"; indicador = "#ef4444"; }
    else if (diff <= 25) { bordaCor = "rgba(245,158,11,0.3)"; indicador = "#f59e0b"; }
    lista.innerHTML += `
      <div class="card" style="background:#1f2937; border-color:${bordaCor}; border-left:3px solid ${indicador}">
        <strong>${prod.nome}</strong>
        <span class="label">Fornecedor:</span> ${prod.fornecedor || "-"}<br>
        <span class="label">Mercado:</span> ${prod.mercado || "-"}<br>
        <span class="label">Código:</span> ${prod.codigo_barras || "-"}<br>
        <span class="label">Lote:</span> ${prod.lote || "-"}<br>
        <span class="label">Qtd:</span> ${prod.quantidade || 0}<br>
        <span class="label">Validade:</span> ${prod.data_validade.split("-").reverse().join("/")}<br>
        <button class="btn btn-blue" style="margin-top:10px" data-id="${prod.id}" data-codigo="${prod.codigo_barras || ""}" data-nome="${prod.nome}" data-fornecedor="${prod.fornecedor || ""}" data-lote="${prod.lote || ""}" data-quantidade="${prod.quantidade || 0}" data-mercado="${prod.mercado || ""}" data-validade="${prod.data_validade || ""}" onclick="abrirEdicao(this)">✏️ Editar</button>
        <button class="btn btn-red" style="margin-top:10px; margin-left:6px" onclick="excluirProduto('${prod.id}', '${prod.nome}')">🗑️ Excluir</button>
      </div>
    `;
  });

  function gerarResumo(items, tipo) {
    if (items.length === 0) return '<div style="padding:8px 0; color:#6b7280; font-size:13px">Nenhum produto nesta categoria.</div>';
    return items.map(p => {
      let detalhe = "";
      if (tipo === "vencido") detalhe = `<span style="color:#ef4444">venceu há ${p.dias} dia(s)</span>`;
      else if (tipo === "critico") detalhe = p.dias === 0 ? `<span style="color:#f59e0b">vence hoje!</span>` : `<span style="color:#f59e0b">vence em ${p.dias} dia(s)</span>`;
      else detalhe = `<span style="color:#10b981">${p.dias} dia(s) restantes</span>`;
      return `<div style="padding:6px 12px; background:#111827; border-radius:8px; margin-top:6px; font-size:13px; display:flex; justify-content:space-between; align-items:center"><div><strong style="color:#e5e7eb">${p.nome}</strong> <span style="color:#6b7280">· Forn: ${p.fornecedor} · Lote: ${p.lote} · Val: ${p.validade}</span></div><div>${detalhe}</div></div>`;
    }).join("");
  }

  alertas.innerHTML = `
    <div class="space-y-3">
      <div style="background:#1f2937; border:1.5px solid rgba(239,68,68,0.25); border-left:3px solid #ef4444; cursor:pointer" class="p-4 rounded-xl" onclick="toggleResumo('resumoVencidos')">
        <div style="display:flex; justify-content:space-between; align-items:center"><span>❌ Vencidos: <strong style="color:#ef4444">${vencidos}</strong></span><span style="color:#6b7280; font-size:12px">▼ clique para ver</span></div>
        <div id="resumoVencidos" style="display:none; margin-top:8px">${gerarResumo(listaVencidos, "vencido")}</div>
      </div>
      <div style="background:#1f2937; border:1.5px solid rgba(245,158,11,0.25); border-left:3px solid #f59e0b; cursor:pointer" class="p-4 rounded-xl" onclick="toggleResumo('resumoCriticos')">
        <div style="display:flex; justify-content:space-between; align-items:center"><span>⚠️ Críticos: <strong style="color:#f59e0b">${criticos}</strong></span><span style="color:#6b7280; font-size:12px">▼ clique para ver</span></div>
        <div id="resumoCriticos" style="display:none; margin-top:8px">${gerarResumo(listaCriticos, "critico")}</div>
      </div>
      <div style="background:#1f2937; border:1.5px solid rgba(16,185,129,0.25); border-left:3px solid #10b981; cursor:pointer" class="p-4 rounded-xl" onclick="toggleResumo('resumoOk')">
        <div style="display:flex; justify-content:space-between; align-items:center"><span>✅ OK: <strong style="color:#10b981">${ok}</strong></span><span style="color:#6b7280; font-size:12px">▼ clique para ver</span></div>
        <div id="resumoOk" style="display:none; margin-top:8px">${gerarResumo(listaOk, "ok")}</div>
      </div>
    </div>
  `;

  // Botão Notificar por Email
  if ((vencidos > 0 || criticos > 0) && !document.getElementById("btnNotifEmail")) {
    const btnEmail = document.createElement("button");
    btnEmail.id = "btnNotifEmail";
    btnEmail.className = "btn btn-green";
    btnEmail.style.cssText = "width:100%; margin-top:12px; padding:12px; font-size:14px";
    btnEmail.innerHTML = "📧 Notificar por Email";
    btnEmail.onclick = () => notificarEmail(listaVencidos, listaCriticos);
    alertas.appendChild(btnEmail);
  }

  document.getElementById("totalProdutos").textContent = data.length;
  document.getElementById("vencidos").textContent = vencidos;
  document.getElementById("alerta").textContent = criticos;
  document.getElementById("ok").textContent = ok;
}

function abrirEdicao(btn) {
  document.getElementById("editId").value = btn.dataset.id;
  document.getElementById("editCodigoBarras").value = btn.dataset.codigo;
  document.getElementById("editNome").value = btn.dataset.nome;
  document.getElementById("editFornecedor").value = btn.dataset.fornecedor;
  document.getElementById("editLote").value = btn.dataset.lote;
  document.getElementById("editQuantidade").value = btn.dataset.quantidade;
  document.getElementById("editMercado").value = btn.dataset.mercado;
  document.getElementById("editValidade").value = btn.dataset.validade;
}

function limparFormulario() {
  ["codigoBarras","nome","fornecedor","lote","quantidade","validade"].forEach(id => document.getElementById(id).value = "");
}

async function exportarCSV() {
  const mercadoSelecionado = mercadoDoUsuario || "";
  let query = supabaseClient.from("produtos").select("*").order("data_validade", { ascending: true });
  if (mercadoSelecionado) query = query.eq("mercado", mercadoSelecionado);
  const { data, error } = await query;
  if (error || !data || data.length === 0) { alert("Nenhum produto para exportar!"); return; }
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  let csv = "Nome,Fornecedor,Mercado,Código de Barras,Lote,Quantidade,Validade,Status\n";
  data.forEach(prod => {
    const validade = parseData(prod.data_validade); validade.setHours(0, 0, 0, 0);
    const diff = Math.floor((validade - hoje) / 86400000);
    let status = "OK"; if (diff < 0) status = "VENCIDO"; else if (diff <= 25) status = "CRÍTICO";
    const dataFmt = prod.data_validade ? prod.data_validade.split("-").reverse().join("/") : "-";
    csv += `"${prod.nome || ""}","${prod.fornecedor || ""}","${prod.mercado || ""}","${prod.codigo_barras || ""}","${prod.lote || ""}","${prod.quantidade || 0}","${dataFmt}","${status}"\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = `estoque_${mercadoSelecionado || "todos"}_${hojeLocal()}.csv`; link.click(); URL.revokeObjectURL(url);
}

function filtrarProdutos() {
  const busca = document.getElementById("buscaProduto").value.toLowerCase();
  const cards = document.querySelectorAll("#lista .card");
  cards.forEach(card => { const texto = card.textContent.toLowerCase(); card.style.display = texto.includes(busca) ? "" : "none"; });
}

async function excluirProduto(id, nome) {
  if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;
  const { error } = await supabaseClient.from("produtos").delete().eq("id", id);
  if (error) return alert("Erro ao excluir: " + error.message);
  alert("Produto excluído com sucesso!"); carregarProdutos();
}

function toggleResumo(id) { const el = document.getElementById(id); if (!el) return; el.style.display = el.style.display === "none" ? "block" : "none"; }

// ==========================
// 🛠️ ADMIN: EDITAR EMAIL DO CLIENTE
// ==========================
function abrirEdicaoEmail(userId, emailAtual) {
  usuarioEditandoId = userId;
  document.getElementById("editUserId").value = userId;
  document.getElementById("editEmailAtual").value = emailAtual;
  document.getElementById("editEmailNovo").value = "";
  document.getElementById("editError").style.display = "none";
  document.getElementById("editSuccess").style.display = "none";
  document.getElementById("modalEdicaoEmail").style.display = "flex";
}

function fecharModalEdicao() {
  document.getElementById("modalEdicaoEmail").style.display = "none";
  usuarioEditandoId = null;
}

async function atualizarEmailAdmin() {
  if (!usuarioEditandoId) return;
  const novoEmail = document.getElementById("editEmailNovo").value.trim().toLowerCase();
  const erroDiv = document.getElementById("editError");
  const sucessoDiv = document.getElementById("editSuccess");
  erroDiv.style.display = "none";
  sucessoDiv.style.display = "none";

  if (!novoEmail) { erroDiv.textContent = "Digite o novo email."; erroDiv.style.display = "block"; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail)) { erroDiv.textContent = "Email inválido."; erroDiv.style.display = "block"; return; }

  const btn = document.querySelector('#modalEdicaoEmail .btn-blue');
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Salvando..."; btn.disabled = true;

  try {
    // 1. Atualiza public.perfis
    const { error: perfilError } = await supabaseClient.from("perfis").update({ email: novoEmail }).eq("user_id", usuarioEditandoId);
    if (perfilError) throw perfilError;
    sucessoDiv.textContent = "✅ Email atualizado na base de dados com sucesso.";
    sucessoDiv.style.display = "block";
    carregarClientesAtivos();
    fecharModalEdicao();
  } catch (err) {
    erroDiv.textContent = (err.message || "Erro ao atualizar.");
    erroDiv.style.display = "block";
  } finally {
    btn.innerHTML = originalText; btn.disabled = false;
  }
}

// ==========================
// 📧 NOTIFICAR POR EMAIL (EmailJS — envio automático)
// ==========================
async function notificarEmail(vencidos, criticos) {
  if (!usuarioAtual || !usuarioAtual.email) {
    alert("Email do usuário não disponível.");
    return;
  }

  let mensagem = "";

  if (vencidos.length > 0) {
    mensagem += "❌ PRODUTOS VENCIDOS:\n\n";
    vencidos.forEach(p => {
      mensagem += `• ${p.nome} — venceu há ${p.dias} dia(s)\n  Fornecedor: ${p.fornecedor} | Lote: ${p.lote} | Validade: ${p.validade}\n\n`;
    });
  }

  if (criticos.length > 0) {
    mensagem += "⚠️ PRODUTOS CRÍTICOS (próximos do vencimento):\n\n";
    criticos.forEach(p => {
      mensagem += `• ${p.nome} — vence em ${p.dias} dia(s)\n  Fornecedor: ${p.fornecedor} | Lote: ${p.lote} | Validade: ${p.validade}\n\n`;
    });
  }

  mensagem += "Acesse o sistema para mais detalhes:\nhttps://frivon.github.io/sistemaestoquevalidade/\n\n— Vence Nunca";

  try {
    await emailjs.send("service_dtsgw62", "template_az8lfps", {
      to_email: usuarioAtual.email,
      message: mensagem
    }, "x7920G1aMjPlDrutG");

    alert("✅ Notificação enviada por email com sucesso! Verifique sua caixa de entrada (ou spam).");
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    alert("❌ Falha ao enviar notificação por email. Tente novamente mais tarde.");
  }
}
