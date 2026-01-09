// GERENCIAMENTO DE AUTENTICAÇÃO
class AuthManager {
    constructor() {
        this.init();
    }
    
    async init() {
        // Verificar autenticação ao carregar a página
        const isAuth = await this.checkAuth();
        
        // Se estiver na página de login e já estiver autenticado, redirecionar
        if (isAuth && window.location.pathname.includes('login.html')) {
            this.redirectBasedOnPlan();
        }
        
        // Se estiver em página protegida e não autenticado, redirecionar para login
        if (!isAuth && this.isProtectedPage()) {
            window.location.href = 'login.html';
        }
    }
    
    // Verificar se a página atual requer autenticação
    isProtectedPage() {
        const protectedPages = ['crm.html', 'admin.html', 'corretor.html'];
        const currentPage = window.location.pathname.split('/').pop();
        return protectedPages.includes(currentPage);
    }
    
    // Verificar autenticação
    async checkAuth() {
        return await supabaseClient.isAuthenticated();
    }
    
    // Cadastrar novo usuário
    async register(formData) {
        try {
            // Validar dados
            const validation = this.validateRegistration(formData);
            if (!validation.valid) {
                return { success: false, error: validation.message };
            }
            
            // Extrair dados do formulário
            const userData = {
                full_name: formData.get('full_name'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                cpf_cnpj: formData.get('cpf_cnpj'),
                creci: formData.get('creci'),
                plan_type: formData.get('plan_type') || 'basico'
            };
            
            // Cadastrar no Supabase
            const result = await supabaseClient.signUp(
                userData.email,
                userData.password,
                userData
            );
            
            if (result.success) {
                // Redirecionar para página de sucesso ou pagamento
                const planType = userData.plan_type;
                
                if (planType === 'free') {
                    // Plano gratuito - redirecionar para CRM
                    window.location.href = 'crm.html';
                } else {
                    // Plano pago - redirecionar para checkout
                    this.initiatePayment(planType, result.user.id);
                }
                
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, error: 'Erro interno do sistema' };
        }
    }
    
    // Login
    async login(formData) {
        try {
            const email = formData.get('email');
            const password = formData.get('password');
            
            if (!email || !password) {
                return { success: false, error: 'Preencha todos os campos' };
            }
            
            const result = await supabaseClient.signIn(email, password);
            
            if (result.success) {
                // Redirecionar com base no plano
                this.redirectBasedOnPlan();
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: 'Credenciais inválidas' };
        }
    }
    
    // Logout
    async logout() {
        try {
            const result = await supabaseClient.signOut();
            if (result.success) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    }
    
    // Redirecionar com base no plano do usuário
    async redirectBasedOnPlan() {
        try {
            const profile = await supabaseClient.getProfile();
            
            if (!profile) {
                window.location.href = 'login.html';
                return;
            }
            
            // Verificar se o plano está ativo
            if (profile.plan_status === 'active') {
                // Redirecionar para CRM
                window.location.href = 'crm.html';
            } else {
                // Plano inativo - mostrar página de planos
                window.location.href = 'planos.html';
            }
        } catch (error) {
            console.error('Erro ao redirecionar:', error);
            window.location.href = 'index.html';
        }
    }
    
    // Validar registro
    validateRegistration(formData) {
        const full_name = formData.get('full_name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirm_password = formData.get('confirm_password');
        const phone = formData.get('phone');
        const cpf_cnpj = formData.get('cpf_cnpj');
        const creci = formData.get('creci');
        const terms = formData.get('terms');
        
        // Validações básicas
        if (!full_name || full_name.length < 3) {
            return { valid: false, message: 'Nome completo deve ter pelo menos 3 caracteres' };
        }
        
        if (!this.validateEmail(email)) {
            return { valid: false, message: 'E-mail inválido' };
        }
        
        if (!this.validatePassword(password)) {
            return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
        }
        
        if (password !== confirm_password) {
            return { valid: false, message: 'As senhas não coincidem' };
        }
        
        if (!phone || phone.length < 10) {
            return { valid: false, message: 'Telefone inválido' };
        }
        
        if (!cpf_cnpj) {
            return { valid: false, message: 'CPF/CNPJ é obrigatório' };
        }
        
        if (!creci) {
            return { valid: false, message: 'CRECI é obrigatório' };
        }
        
        if (!terms) {
            return { valid: false, message: 'Você deve aceitar os termos de uso' };
        }
        
        return { valid: true };
    }
    
    // Validar e-mail
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Validar senha
    validatePassword(password) {
        return password && password.length >= 6;
    }
    
    // Iniciar pagamento (integração com Mercado Pago)
    async initiatePayment(planType, userId) {
        try {
            const plan = CONFIG.PLANOS[planType];
            if (!plan) {
                console.error('Plano não encontrado:', planType);
                return;
            }
            
            // Aqui você integraria com Mercado Pago
            // Por enquanto, apenas simule o redirecionamento
            console.log('Iniciando pagamento para plano:', plan.nome);
            
            // Em produção, você faria:
            // 1. Criar preferência no Mercado Pago
            // 2. Redirecionar para checkout
            // 3. Configurar webhook para atualizar status
            
            // Para desenvolvimento, vamos simular sucesso
            setTimeout(() => {
                alert(`Pagamento simulado para ${plan.nome}. Em produção, isso redirecionaria para o Mercado Pago.`);
                window.location.href = 'crm.html';
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao iniciar pagamento:', error);
            alert('Erro ao processar pagamento. Tente novamente.');
        }
    }
    
    // Obter dados do usuário atual
    async getCurrentUserData() {
        return await supabaseClient.getCurrentUser();
    }
    
    // Obter perfil atual
    async getCurrentProfile() {
        return await supabaseClient.getProfile();
    }
}

// Inicializar gerenciador de autenticação
window.authManager = new AuthManager();

// Funções globais para uso nos forms
window.handleRegister = async function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
    submitBtn.disabled = true;
    
    const result = await authManager.register(formData);
    
    if (result.success) {
        // Redirecionamento será feito pelo authManager
    } else {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar erro
        alert(result.error || 'Erro ao cadastrar. Tente novamente.');
    }
};

window.handleLogin = async function(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Entrando...';
    submitBtn.disabled = true;
    
    const result = await authManager.login(formData);
    
    if (!result.success) {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar erro
        alert(result.error || 'Erro ao fazer login. Tente novamente.');
    }
};

window.handleLogout = async function() {
    await authManager.logout();
};