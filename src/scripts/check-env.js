require('dotenv').config();

console.log('==== Verificação de Variáveis de Ambiente ====');
console.log('NODE_ENV:', process.env.NODE_ENV || 'não definido');

// Verificando variáveis do Supabase
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'definido' : 'NÃO DEFINIDO ⚠️');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'definido' : 'NÃO DEFINIDO ⚠️');

// Verificando variáveis JWT
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'definido' : 'NÃO DEFINIDO ⚠️');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '24h (padrão)');

// Verificando outras variáveis
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'não definido (usará CORS *)');
console.log('PORT:', process.env.PORT || '3000 (padrão)');

console.log('============================================');

// Verifica se as variáveis críticas estão definidas
const criticalVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
const missingVars = criticalVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('ERRO: As seguintes variáveis críticas não estão definidas:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  console.error('A aplicação pode não funcionar corretamente sem estas variáveis!');
}

module.exports = {
  checkEnv: () => {
    return {
      missingVars,
      critical: missingVars.length === 0,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    };
  }
}; 