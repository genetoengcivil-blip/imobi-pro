// CONFIGURAÇÕES GLOBAIS DO IMOBIPRO
const CONFIG = {
    // Ambiente: 'dev' ou 'prod'
    ENV: 'dev',
    
    // URLs do sistema (alterar para produção)
    APP_URL: window.location.origin,
    API_URL: window.location.origin + '/api',
    
    // Supabase (substitua com suas credenciais)
    SUPABASE_URL: 'https://wzoaiuwmxnrpnwixvcck.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b2FpdXdteG5ycG53aXh2Y2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTkwNDAsImV4cCI6MjA4MzM5NTA0MH0.1aAvSD6mSBlXSTv07VDatKKZ2E8klO1IyLWM9ou8KW4',
    
    // Mercado Pago (TEST para desenvolvimento)
    MERCADO_PAGO_PUBLIC_KEY: 'TEST-c599d5c7-7371-49f9-9942-9691ddf58201',
    
    // Planos disponíveis
    PLANOS: {
        basico: {
            id: 'plano_basico',
            nome: 'Básico',
            preco: 97.00,
            moeda: 'BRL',
            recorrencia: 'mensal',
            recursos: [
                'Até 10 imóveis cadastrados',
                'Site pessoal responsivo',
                'Dashboard básico',
                'Captura de leads',
                'Suporte por email'
            ],
            limite_imoveis: 10
        },
        profissional: {
            id: 'plano_profissional',
            nome: 'Profissional',
            preco: 197.00,
            moeda: 'BRL',
            recorrencia: 'mensal',
            recursos: [
                'Imóveis ilimitados',
                'Site personalizado com domínio',
                'Dashboard avançado com gráficos',
                'Análise de leads',
                'Sistema de agendamentos',
                'Suporte prioritário'
            ],
            limite_imoveis: -1 // -1 = ilimitado
        },
        empresarial: {
            id: 'plano_empresarial',
            nome: 'Empresarial',
            preco: 397.00,
            moeda: 'BRL',
            recorrencia: 'mensal',
            recursos: [
                'Tudo do plano Profissional',
                'Multi-usuários (até 5)',
                'Relatórios avançados',
                'API de integração',
                'Exportação de dados',
                'Suporte 24/7 via WhatsApp'
            ],
            limite_imoveis: -1
        }
    },
    
    // Configurações padrão
    DEFAULT_SETTINGS: {
        theme: 'light',
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        items_per_page: 10
    },
    
    // Estados brasileiros
    ESTADOS_BR: [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ],
    
    // Tipos de imóveis
    TIPOS_IMOVEL: [
        'Casa', 'Apartamento', 'Sobrado', 'Kitnet', 'Cobertura',
        'Terreno', 'Sítio', 'Fazenda', 'Comercial', 'Salão',
        'Galpão', 'Loja', 'Prédio', 'Chácara'
    ],
    
    // Status de leads
    LEAD_STATUS: {
        NOVO: 'novo',
        CONTACTADO: 'contactado',
        INTERESSADO: 'interessado',
        AGENDADO: 'agendado',
        CONVERTIDO: 'convertido',
        DESCARTADO: 'descartado'
    }
};

// Exportar para uso global
window.CONFIG = CONFIG;

// Inicializar Mercado Pago se estiver disponível
document.addEventListener('DOMContentLoaded', function() {
    if (typeof MercadoPago !== 'undefined') {
        window.mp = new MercadoPago(CONFIG.MERCADO_PAGO_PUBLIC_KEY, {
            locale: 'pt-BR'
        });
        console.log('Mercado Pago inicializado');
    }
});

// Verificar se estamos no ambiente correto
if (CONFIG.ENV === 'dev') {
    console.warn('⚠️  Modo desenvolvimento ativo. Configure as credenciais antes de produção.');
}