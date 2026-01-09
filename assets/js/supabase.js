// CLIENTE SUPABASE PARA IMOBIPRO
class SupabaseClient {
    constructor() {
        if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
            console.error('❌ Credenciais do Supabase não configuradas!');
            console.log('Configure em assets/js/config.js:');
            console.log('- SUPABASE_URL: https://seu-projeto.supabase.co');
            console.log('- SUPABASE_ANON_KEY: sua-chave-anon-aqui');
            return;
        }
        
        // Inicializar cliente Supabase
        this.supabase = supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
        
        console.log('✅ Supabase inicializado');
    }
    
    // ========== AUTENTICAÇÃO ==========
    
    // Cadastrar novo usuário
    async signUp(email, password, userData) {
        try {
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: userData.full_name,
                        phone: userData.phone
                    }
                }
            });
            
            if (authError) throw authError;
            
            // Criar perfil do corretor
            const { error: profileError } = await this.supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email: email,
                    full_name: userData.full_name,
                    phone: userData.phone,
                    cpf_cnpj: userData.cpf_cnpj,
                    creci: userData.creci,
                    plan_type: 'free',
                    plan_status: 'inactive'
                });
            
            if (profileError) throw profileError;
            
            return { success: true, user: authData.user };
        } catch (error) {
            console.error('Erro no cadastro:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Login
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Logout
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Obter usuário atual
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }
    }
    
    // Verificar se usuário está autenticado
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return user !== null;
    }
    
    // ========== PERFIL ==========
    
    // Obter perfil do corretor
    async getProfile(userId = null) {
        try {
            let targetId = userId;
            
            if (!targetId) {
                const user = await this.getCurrentUser();
                if (!user) return null;
                targetId = user.id;
            }
            
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', targetId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
            return null;
        }
    }
    
    // Atualizar perfil
    async updateProfile(profileData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            const { data, error } = await this.supabase
                .from('profiles')
                .update(profileData)
                .eq('id', user.id);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== IMÓVEIS ==========
    
    // Listar imóveis do corretor
    async getProperties(filters = {}) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            let query = this.supabase
                .from('properties')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            // Aplicar filtros
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            
            if (filters.property_type) {
                query = query.eq('property_type', filters.property_type);
            }
            
            if (filters.featured !== undefined) {
                query = query.eq('featured', filters.featured);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao listar imóveis:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Adicionar novo imóvel
    async addProperty(propertyData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            // Verificar limite do plano
            const profile = await this.getProfile();
            const properties = await this.getProperties();
            
            if (profile.plan_type === 'basico' && 
                properties.data && 
                properties.data.length >= CONFIG.PLANOS.basico.limite_imoveis) {
                throw new Error('Limite de imóveis atingido. Faça upgrade do plano.');
            }
            
            const { data, error } = await this.supabase
                .from('properties')
                .insert({
                    ...propertyData,
                    user_id: user.id
                })
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao adicionar imóvel:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== LEADS ==========
    
    // Registrar lead (público)
    async registerLead(propertyId, leadData) {
        try {
            // Primeiro, precisamos obter o user_id do proprietário do imóvel
            const { data: property, error: propError } = await this.supabase
                .from('properties')
                .select('user_id')
                .eq('id', propertyId)
                .single();
            
            if (propError) throw propError;
            
            const { data, error } = await this.supabase
                .from('leads')
                .insert({
                    property_id: propertyId,
                    user_id: property.user_id,
                    ...leadData
                })
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao registrar lead:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Obter leads do corretor
    async getLeads(filters = {}) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            let query = this.supabase
                .from('leads')
                .select(`
                    *,
                    properties (
                        title,
                        price
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            
            if (filters.property_id) {
                query = query.eq('property_id', filters.property_id);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao obter leads:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== PAGAMENTOS ==========
    
    // Registrar pagamento
    async registerPayment(paymentData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');
            
            const { data, error } = await this.supabase
                .from('payments')
                .insert({
                    user_id: user.id,
                    ...paymentData
                })
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            return { success: false, error: error.message };
        }
    }
}

// Criar instância global
window.supabaseClient = new SupabaseClient();