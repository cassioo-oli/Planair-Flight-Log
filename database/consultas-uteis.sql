SELECT f.nome, r.data_referencia, r.entrada, r.saida_almoco, r.retorno_almoco, r.saida
FROM funcionarios f LEFT JOIN registros_ponto r ON r.funcionario_id=f.id AND r.data_referencia=CURDATE()
WHERE f.ativo=1 ORDER BY f.nome;

SELECT * FROM registros_ponto WHERE funcionario_id=1 ORDER BY data_referencia DESC;
