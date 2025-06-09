// Variável para armazenar o tipo de usuário selecionado
let selectedUserType = '';

// Adiciona eventos de clique aos botões de seleção de tipo de usuário
document.querySelectorAll('.btnChoose').forEach(button => {
    button.addEventListener('click', function () {
        // Remove a classe 'selected' de todos os botões
        document.querySelectorAll('.btnChoose').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Adiciona a classe 'selected' apenas ao botão clicado
        this.classList.add('selected');
        
        // Atualiza o valor do campo oculto e a variável
        selectedUserType = this.dataset.user;
        document.getElementById('userType').value = selectedUserType;
    });
});

// Adiciona evento de submissão ao formulário
document.getElementById('loginInterface').addEventListener('submit', function(ev) {
    // Impede o envio padrão do formulário
    ev.preventDefault();
    
    // Obtém os valores dos campos
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    
    // Valida os campos
    if (!userType) {
        alert('Por favor, selecione um tipo de usuário.');
        return;
    }
    
    if (!email) {
        alert('Por favor, preencha o e-mail ou nome de usuário.');
        return;
    }
    
    if (!password) {
        alert('Por favor, preencha a senha.');
        return;
    }
    
    // Se tudo estiver válido, envia o formulário
    this.submit();
});