# Segurança

Não publique `.env`, chaves, pesos privados ou mídias pessoais. A chave do backend fica somente no servidor Node. O gateway aceita apenas rotas fixas, restringe origem, limita upload e prazo, e escuta em loopback. Não constitui uma solução multiusuário pronta para hospedagem pública. Configure autenticação de usuários e limites no proxy antes de expor a rede. Resultados de IA exigem validação humana; demo não executa inferência.
