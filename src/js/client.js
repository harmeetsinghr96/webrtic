const LoginController = (() => {

    const inputs = () => { 
       return {
            username: document.getElementById('username').value
        }
    }

    const isError = (values) => {
        let errors = [];
        const { username } = values;

        if (username.trim().length <= 0) {
            errors.push({ error: 'Password is required' });
        }

        return errors;
    }

    const displayErrors = (errors) => {
        for (const err of errors) {
            alert(err.error);
        }
    }

    return {
        inputs,
        isError,
        displayErrors
    }
})();


function formSubmit() {
    const { username } = LoginController.inputs();
    let errors = LoginController.isError({ username });
    if (errors.length > 0) {
        return LoginController.displayErrors(errors);
    }

    window.location = `?username=${username}`;
}

