(function () {
  function showLogin(message) {
    localStorage.removeItem("gie360_auth");
    if (typeof loginPage !== "undefined") loginPage.style.display = "flex";
    if (typeof app !== "undefined") app.style.display = "none";
    if (typeof loginMsg !== "undefined") loginMsg.textContent = message || "";
  }

  function openApp(user) {
    const appUser = {
      nome: user?.name || user?.email || "Administrador",
      login: user?.email || "",
      email: user?.email || "",
      perfil: "Administrador",
    };

    currentUser = appUser;
    currentRole = "Administrador";
    localStorage.removeItem("gie360_auth");

    loginPage.style.display = "none";
    app.style.display = "block";
    nomeUsuarioSide.textContent = appUser.nome;
    perfilUsuarioSide.textContent = "Perfil: Administrador";
    aplicarPermissoes();
    render();
  }

  async function realLogin() {
    const email = String(loginUser.value || "").trim().toLowerCase();
    const password = String(loginPass.value || "");

    if (!email || !password) {
      loginMsg.textContent = "Informe o e-mail e a senha.";
      return;
    }

    const button = document.querySelector(".login-btn");
    if (button) button.disabled = true;
    loginMsg.textContent = "Entrando...";

    try {
      const response = await fetch("/api/auth-login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        loginMsg.textContent = "E-mail ou senha inválidos.";
        return;
      }

      loginPass.value = "";
      openApp(data.user);
    } catch {
      loginMsg.textContent = "Não foi possível entrar agora. Tente novamente.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function realLogout() {
    try {
      await fetch("/api/auth-logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      showLogin("");
      location.reload();
    }
  }

  async function realForgotPassword() {
    const email = String(loginUser.value || "").trim().toLowerCase();
    if (!email) {
      loginMsg.textContent = "Informe seu e-mail para recuperar a senha.";
      loginUser.focus();
      return;
    }

    loginMsg.textContent = "Enviando instruções...";
    try {
      const response = await fetch("/api/auth-forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("request_failed");
      loginMsg.textContent = "Se o e-mail estiver cadastrado, você receberá o link para criar uma nova senha.";
    } catch {
      loginMsg.textContent = "Não foi possível enviar agora. Tente novamente.";
    }
  }

  async function completePasswordReset(token) {
    const newPassword = window.prompt("Digite uma nova senha com pelo menos 8 caracteres:");
    if (newPassword === null) return;
    if (newPassword.length < 8) {
      loginMsg.textContent = "A nova senha precisa ter pelo menos 8 caracteres.";
      return;
    }

    const confirmation = window.prompt("Digite novamente a nova senha:");
    if (newPassword !== confirmation) {
      loginMsg.textContent = "As senhas informadas não são iguais.";
      return;
    }

    loginMsg.textContent = "Salvando a nova senha...";
    try {
      const response = await fetch("/api/auth-reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error("reset_failed");
      history.replaceState({}, "", location.pathname);
      loginMsg.textContent = "Senha alterada. Agora você já pode entrar.";
    } catch {
      loginMsg.textContent = "O link é inválido ou expirou. Solicite uma nova recuperação.";
    }
  }

  async function restoreSession() {
    try {
      const response = await fetch("/api/auth-session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.authenticated) {
        openApp(data.user);
      } else {
        showLogin("");
      }
    } catch {
      showLogin("Não foi possível verificar a sessão.");
    }
  }

  window.doLogin = realLogin;
  window.sair = realLogout;
  window.esqueciSenha424 = realForgotPassword;

  document.addEventListener("DOMContentLoaded", async function () {
    if (typeof loginUser !== "undefined") {
      loginUser.placeholder = "E-mail";
      loginUser.type = "email";
      loginUser.autocomplete = "email";
    }

    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
    const resetToken = params.get("token") || hashParams.get("token");
    const resetError = params.get("error") || hashParams.get("error");

    if (resetError) {
      showLogin("O link de recuperação é inválido ou expirou. Solicite um novo.");
      history.replaceState({}, "", location.pathname);
      return;
    }

    if (resetToken) {
      showLogin("");
      await completePasswordReset(resetToken);
      return;
    }

    await restoreSession();
  });
})();
