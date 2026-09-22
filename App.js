import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from './services/api';

// chaves que eu uso pra guardar as coisas no AsyncStorage
const CHAVE_LISTA = '@apiecache:personagens';
const CHAVE_DATA = '@apiecache:salvoEm';

// tempo que o cache continua valendo (5 minutos)
const VALIDADE_CACHE = 5 * 60 * 1000;

export default function App() {
  const [personagens, setPersonagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [origem, setOrigem] = useState(''); // 'api' ou 'cache'
  const [salvoEm, setSalvoEm] = useState(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  // salva a lista e a hora em que ela foi salva
  async function salvarNoCache(lista) {
    const agora = Date.now();
    try {
      await AsyncStorage.setItem(CHAVE_LISTA, JSON.stringify(lista));
      await AsyncStorage.setItem(CHAVE_DATA, String(agora));
      setSalvoEm(agora);
    } catch (e) {
      console.log('nao consegui salvar no cache', e);
    }
  }

  async function lerDoCache() {
    const lista = await AsyncStorage.getItem(CHAVE_LISTA);
    const data = await AsyncStorage.getItem(CHAVE_DATA);

    if (lista === null) {
      return null;
    }

    return { lista: JSON.parse(lista), salvoEm: Number(data) };
  }

  // aqui e onde o axios entra
  async function buscarNaApi() {
    const resposta = await api.get('/character');
    return resposta.data.results;
  }

  async function carregarDados(forcarApi) {
    setCarregando(true);
    setAviso('');

    try {
      const cache = await lerDoCache();
      const cacheVencido = cache ? Date.now() - cache.salvoEm > VALIDADE_CACHE : true;

      // se ja tem cache e ele ainda esta valendo, nem precisa chamar a API
      if (cache && !cacheVencido && !forcarApi) {
        setPersonagens(cache.lista);
        setSalvoEm(cache.salvoEm);
        setOrigem('cache');
        setAviso('Dados vieram do cache, a API nao foi chamada.');
        setCarregando(false);
        return;
      }

      const lista = await buscarNaApi();
      setPersonagens(lista);
      setOrigem('api');
      setAviso('Dados baixados da API e salvos no cache.');
      await salvarNoCache(lista);
    } catch (erro) {
      console.log('deu erro na requisicao:', erro.message);

      // se a API falhar (sem internet por exemplo) eu mostro o que esta salvo
      const cache = await lerDoCache();
      if (cache) {
        setPersonagens(cache.lista);
        setSalvoEm(cache.salvoEm);
        setOrigem('cache');
        setAviso('A API nao respondeu, entao estou mostrando o cache.');
      } else {
        setAviso('Nao deu pra carregar os dados e nao existe nada no cache.');
      }
    } finally {
      setCarregando(false);
    }
  }

  async function limparCache() {
    await AsyncStorage.multiRemove([CHAVE_LISTA, CHAVE_DATA]);
    setPersonagens([]);
    setSalvoEm(null);
    setOrigem('');
    setAviso('Cache apagado. Toque em "Buscar na API" para baixar de novo.');
  }

  function formatarHora(ms) {
    const data = new Date(ms);
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    const segundo = String(data.getSeconds()).padStart(2, '0');
    return hora + ':' + minuto + ':' + segundo;
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.foto} />
        <View style={styles.dados}>
          <Text style={styles.nome}>{item.name}</Text>
          <Text style={styles.linha}>Especie: {item.species}</Text>
          <Text style={styles.linha}>Status: {item.status}</Text>
          <Text style={styles.linha}>Planeta: {item.origin.name}</Text>
        </View>
      </View>
    );
  }

  let textoOrigem = 'Fonte: -';
  if (origem === 'api') {
    textoOrigem = 'Fonte: API (axios)';
  }
  if (origem === 'cache') {
    textoOrigem = 'Fonte: cache (AsyncStorage)';
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Acesso a API e Cache</Text>
        <Text style={styles.subtitulo}>
          {textoOrigem}
          {salvoEm ? ' - salvo as ' + formatarHora(salvoEm) : ''}
        </Text>
      </View>

      <View style={styles.botoes}>
        <TouchableOpacity style={styles.botao} onPress={() => carregarDados(true)}>
          <Text style={styles.textoBotao}>Buscar na API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botao, styles.botaoCinza]}
          onPress={limparCache}>
          <Text style={styles.textoBotao}>Limpar cache</Text>
        </TouchableOpacity>
      </View>

      {aviso !== '' ? <Text style={styles.aviso}>{aviso}</Text> : null}

      {carregando ? (
        <ActivityIndicator size="large" color="#2b6cb0" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={personagens}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum personagem carregado ainda.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef1f5',
  },
  header: {
    backgroundColor: '#2b6cb0',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  titulo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#dbeafe',
    fontSize: 13,
    marginTop: 4,
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  botao: {
    flex: 1,
    backgroundColor: '#2b6cb0',
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  botaoCinza: {
    backgroundColor: '#6b7280',
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
  },
  aviso: {
    marginTop: 10,
    marginHorizontal: 16,
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  foto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
    backgroundColor: '#d1d5db',
  },
  dados: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#111827',
  },
  linha: {
    fontSize: 13,
    color: '#4b5563',
  },
  vazio: {
    textAlign: 'center',
    marginTop: 30,
    color: '#6b7280',
  },
});
