const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
    try {
        // Verificar se o token foi fornecido
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                error: {
                    message: 'Token não fornecido',
                    details: 'É necessário fornecer um token de autenticação'
                }
            });
        }

        // Extrair o token do header
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: {
                    message: 'Token inválido',
                    details: 'Formato do token inválido'
                }
            });
        }

        // Verificar o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Verificar se o usuário existe no Supabase
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({
                error: {
                    message: 'Token inválido',
                    details: 'Usuário não encontrado'
                }
            });
        }

        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(401).json({
            error: {
                message: 'Token inválido',
                details: 'Token expirado ou inválido'
            }
        });
    }
};

module.exports = authMiddleware; 