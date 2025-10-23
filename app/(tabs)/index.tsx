import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>


      <Text style={styles.title}>Welcome to BinaryMed</Text>
      <Text style={styles.subtitle}>
        Your trusted partner in pathology logistics
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff",
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#3F3F46",
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: "#7B3FA2",
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

