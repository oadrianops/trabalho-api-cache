# Trabalho – Acesso a API e Cache

**Aluno:** Adriano Pinheiro da Silva - 04193658
**Tecnologias:** React Native (Expo Snack), Axios, AsyncStorage
**Link online:** https://snack.expo.dev/@oadrianops/apiecache

---

## 1. O que o aplicativo faz

O app mostra uma lista de personagens vinda da API pública do **Rick and Morty**
(`https://rickandmortyapi.com/api/character`). Para cada personagem ele exibe a foto,
o nome, a espécie, o status (vivo/morto) e o planeta de origem.

A diferença está no que acontece **depois** da busca: assim que os dados chegam da API,
eles são gravados no armazenamento do próprio aparelho (cache). Nas próximas vezes que o
app abrir, ele usa esses dados salvos em vez de chamar a API de novo — a requisição só é
refeita quando o cache passa de 5 minutos ou quando o usuário aperta o botão de atualizar.

Na tela existem:

- Um cabeçalho que informa **de onde vieram os dados** ("Fonte: API (axios)" ou
  "Fonte: cache (AsyncStorage)") e a hora em que foram salvos;
- Botão **Buscar na API** – força uma nova requisição e regrava o cache;
- Botão **Limpar cache** – apaga os dados salvos no AsyncStorage;
- Uma mensagem explicando o que aconteceu na última ação;
- A lista de personagens (`FlatList`).

---

## 2. Estrutura dos arquivos

```
App.js              -> tela, estados e toda a lógica de cache
services/api.js     -> configuração do axios (baseURL e timeout)
package.json        -> dependências (axios e @react-native-async-storage/async-storage)
README.md           -> resumo do projeto
```

---

## 3. Como o app funciona por dentro

### 3.1 Conexão com a API (Axios)

O axios foi configurado em um arquivo separado, com a URL base da API:

```js
const api = axios.create({
  baseURL: 'https://rickandmortyapi.com/api',
  timeout: 10000,
});
```

E a requisição em si acontece na função `buscarNaApi()` do `App.js`:

```js
async function buscarNaApi() {
  const resposta = await api.get('/character');
  return resposta.data.results;
}
```

### 3.2 Armazenamento em cache (AsyncStorage)

Depois que os dados chegam, duas informações são gravadas: a **lista** (convertida para
texto com `JSON.stringify`) e o **momento** em que ela foi salva.

```js
await AsyncStorage.setItem(CHAVE_LISTA, JSON.stringify(lista));
await AsyncStorage.setItem(CHAVE_DATA, String(agora));
```

A leitura faz o caminho inverso, com `AsyncStorage.getItem` e `JSON.parse`, e a limpeza
usa `AsyncStorage.multiRemove`.

### 3.3 Fluxo completo (função `carregarDados`)

1. O app abre e o `useEffect` chama `carregarDados()`.
2. Lê o cache. Se não existir nada salvo, vai direto para a API.
3. Se existir, compara a hora salva com a hora atual:
   - **cache com menos de 5 minutos** → mostra os dados salvos e **não chama a API**;
   - **cache vencido** (ou botão "Buscar na API" pressionado) → faz a requisição com
     axios e regrava o cache.
4. Se a requisição falhar (sem internet, API fora do ar), o app cai no `catch`, lê o
   cache de novo e mostra os dados antigos com um aviso na tela — ou seja, o app continua
   funcionando offline se já tiver buscado alguma vez.

O tempo de validade é uma constante, fácil de alterar:

```js
const VALIDADE_CACHE = 5 * 60 * 1000; // 5 minutos
```

---

## 4. Como cada requisito do trabalho foi cumprido

| Requisito do enunciado | Onde foi cumprido |
|---|---|
| Programa em **React Native** | App feito em React Native no Expo Snack (`App.js`), usando `SafeAreaView`, `FlatList`, `Image`, `TouchableOpacity`, `ActivityIndicator` e `StyleSheet`. |
| **Conectar a uma API** (livre escolha) | API pública do Rick and Morty, endpoint `/character` — não precisa de chave nem login. |
| Usar a biblioteca **Axios** | Instância criada em `services/api.js` com `axios.create({ baseURL, timeout })` e usada em `api.get('/character')`. A dependência `axios` está declarada no `package.json`. |
| Após trazer os dados, **armazenar em cache** | Logo depois da resposta da API, a função `salvarNoCache()` grava a lista e a data da gravação. |
| Usar a biblioteca **AsyncStorage** | `@react-native-async-storage/async-storage` com `setItem`, `getItem` e `multiRemove`; dependência declarada no `package.json`. |
| Trabalho **individual ou em dupla** | Trabalho individual. |
| Envio do **código para o Teams** (obrigatório) | Arquivos entregues no `.zip` (`App.js`, `services/api.js`, `README.md`, `package.json`). |
| **Link do código online** (opcional) | https://snack.expo.dev/@oadrianops/apiecache |

Além do mínimo pedido, o app também:

- mostra na tela **se os dados vieram da API ou do cache**, o que deixa o funcionamento
  do cache visível na hora da apresentação;
- define um **tempo de validade** para o cache, em vez de simplesmente guardar para sempre;
- usa o cache como **plano B** quando a API não responde.

---

## 5. Como testar

1. Abrir o Snack: https://snack.expo.dev/@oadrianops/apiecache
2. Na primeira execução aparece "Fonte: API (axios)" e a mensagem
   *"Dados baixados da API e salvos no cache."*
3. Recarregar o app (ou fechar e abrir): aparece "Fonte: cache (AsyncStorage)" e
   *"Dados vieram do cache, a API não foi chamada."*
4. Tocar em **Limpar cache**: a lista some.
5. Tocar em **Buscar na API**: a lista volta e o cache é gravado de novo.

Para testar no celular, basta usar a aba **My Device** do Snack e ler o QR Code com o
aplicativo Expo Go.