const controller = (() => {

    const inputs = { 
        email: document.getElementById('email').value, 
        password: document.getElementById('password').value
    }

    return {
        inputs
    }
})();


function formSubmit() {
    const { email, password } = controller.inputs;

    alert(email);
}