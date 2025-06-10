// Adiciona eventos de clique aos botões de seleção de tipo de usuário
document.addEventListener('DOMContentLoaded', function() {
    // Encontra todos os botões de escolha de usuário
    const buttons = document.querySelectorAll('.btnChoose');
    const userTypeInput = document.getElementById('userType');
    
    // Adiciona evento de clique a cada botão
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove a classe 'selected' de todos os botões
            buttons.forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Adiciona a classe 'selected' apenas ao botão clicado
            this.classList.add('selected');
            
            // Atualiza o valor do campo oculto
            userTypeInput.value = this.dataset.user;
            userTypeInput.setAttribute('required', 'required');
        });
    });
    
    // Adiciona validação ao formulário
    const form = document.getElementById('loginInterface');
    if (form) {
        form.addEventListener('submit', function(event) {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const userType = userTypeInput.value;
            
            // Validação simples do lado do cliente
            if (!userType) {
                event.preventDefault();
                alert('Por favor, selecione um tipo de usuário.');
                return false;
            }
            
            if (!email) {
                event.preventDefault();
                alert('Por favor, preencha o e-mail ou nome de usuário.');
                return false;
            }
            
            if (!password) {
                event.preventDefault();
                alert('Por favor, preencha a senha.');
                return false;
            }
            
            // Se a validação passar, o formulário será enviado normalmente
            return true;
        });
    }
});