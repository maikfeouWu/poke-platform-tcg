// cuenta.js — Crear cuenta / iniciar sesión (identificación simple por email)

function renderSessionState() {
  const session = getSession();
  document.getElementById('loggedOutView').style.display = session ? 'none' : 'block';
  document.getElementById('loggedInView').style.display = session ? 'block' : 'none';
  if (session) {
    document.getElementById('sessionNombre').textContent = session.nombre;
    document.getElementById('sessionEmail').textContent = session.email;
  }
}

document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const msg = document.getElementById('registroMsg');
  try {
    const resp = await apiSend('POST', '/usuarios', {
      nombre: form.get('nombre'),
      email: form.get('email'),
      direccion_envio: form.get('direccion_envio') || null,
      rol: 'cliente',
    });
    setSession({ id_usuario: resp.id_usuario, nombre: form.get('nombre'), email: form.get('email') });
    renderSessionState();
  } catch (err) {
    msg.style.display = 'block';
    msg.textContent = err.error || 'No se pudo crear la cuenta.';
  }
});

document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const msg = document.getElementById('loginMsg');
  try {
    const usuario = await apiGet(`/usuarios/buscar/por-email?email=${encodeURIComponent(form.get('email'))}`);
    setSession(usuario);
    renderSessionState();
  } catch (err) {
    msg.style.display = 'block';
    msg.textContent = err.error || 'No encontramos una cuenta con ese email.';
  }
});

document.getElementById('btnLogout').addEventListener('click', () => {
  clearSession();
  renderSessionState();
});

renderSessionState();
