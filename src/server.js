require('dotenv').config();
const app = require('./index');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log('Variáveis de ambiente carregadas:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado');
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Configurado' : 'Não configurado');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurado' : 'Não configurado');
}); 