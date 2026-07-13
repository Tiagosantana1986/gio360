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

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof loginUser !== "undefined") {
      loginUser.placeholder = "E-mail";
      loginUser.type = "email";
      loginUser.autocomplete = "email";
    }
    restoreSession();
  });
})();
