function showForm(tipo) {
    document.getElementById('registerAluno').style.display = 'none'
    document.getElementById('registerAcademia').style.display = 'none'
    document.getElementById('registerProfissional').style.display = 'none'
 
    if (tipo === 'aluno') {
        document.getElementById('registerAluno').style.display = 'block'
    } else if (tipo === 'academia') {
        document.getElementById('registerAcademia').style.display = 'block'
    } else if (tipo === 'profissional') {
        document.getElementById('registerProfissional').style.display = 'block'
        alterType();
    }
}
 
 
function alterType(){
    const radios = document.querySelectorAll('input[name="tipoProf"]');
    const labelDinamica = document.getElementById('labelCpfCnpj');
   
    radios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.checked) {
                labelDinamica.textContent = this.value;
            }
        });
    });
}
 
document.addEventListener('DOMContentLoaded', function () {
    alterType();
});
 
