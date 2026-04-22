// Atrapamos el formulario usando su ID
const formulario = document.getElementById('formularioLogin') as HTMLFormElement;

// Le decimos qué hacer cuando se envíe el formulario
formulario.addEventListener('submit', (evento: Event) => {
  evento.preventDefault();

  // Capturamos las cajas de texto
  const inputEmail = document.getElementById('email') as HTMLInputElement;
  const inputPassword = document.getElementById('password') as HTMLInputElement;

  // Sacamos lo que el usuario ha escrito dentro
  const emailUsuario = inputEmail.value;
  const passwordUsuario = inputPassword.value;

  console.log('Intentando hacer login con:', emailUsuario, passwordUsuario);
});
