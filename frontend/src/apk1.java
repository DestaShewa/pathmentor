 import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import * as Notifications from "expo-notifications";

// Bible verses
const verses = [
  "Philippians 4:13 - I can do all things through Christ who strengthens me.",
  "Psalm 23:1 - The Lord is my shepherd; I shall not want.",
  "John 3:16 - For God so loved the world that He gave His only Son.",
  "Romans 8:28 - All things work together for good to those who love God.",
  "Isaiah 41:10 - Fear not, for I am with you.",
  "Proverbs 3:5 - Trust in the Lord with all your heart.",
  "Matthew 6:33 - Seek first the kingdom of God."
];

export default function App() {
  const [verse, setVerse] = useState("Tap below to get a Bible verse 🙏");

  useEffect(() => {
    requestPermissions();
    scheduleDailyNotifications();
  }, []);

  // Get random verse
  const getRandomVerse = () => {
    const randomIndex = Math.floor(Math.random() * verses.length);
    setVerse(verses[randomIndex]);
  };

  // Ask notification permission
  async function requestPermissions() {
    await Notifications.requestPermissionsAsync();
  }

  // Schedule 7 daily prayer reminders
  async function scheduleDailyNotifications() {
    const times = [
      { hour: 6, minute: 0 },
      { hour: 9, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 18, minute: 0 },
      { hour: 21, minute: 0 },
      { hour: 23, minute: 0 },
    ];

    times.forEach(async (time, index) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🙏 Prayer Time",
          body: verses[index % verses.length],
        },
        trigger: {
          hour: time.hour,
          minute: time.minute,
          repeats: true,
        },
      });
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🙏 Prayer Reminder</Text>

      <Image
        source={{
          uri: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Christ_Pantocrator.jpg"
        }}
        style={styles.image}
      />

      <Text style={styles.verse}>{verse}</Text>

      <TouchableOpacity style={styles.button} onPress={getRandomVerse}>
        <Text style={styles.buttonText}>Get Bible Verse</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    fontWeight: "bold",
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
  },
  verse: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";

// Bible verses
const verses = [
  "Philippians 4:13 - I can do all things through Christ who strengthens me.",
  "Psalm 23:1 - The Lord is my shepherd; I shall not want.",
  "John 3:16 - For God so loved the world that He gave His only Son.",
  "Romans 8:28 - All things work together for good to those who love God.",
  "Isaiah 41:10 - Fear not, for I am with you.",
  "Proverbs 3:5 - Trust in the Lord with all your heart.",
  "Matthew 6:33 - Seek first the kingdom of God."
];

// 4K Orthodox-style images
const images = [
  "https://upload.wikimedia.org/wikipedia/commons/5/5c/Christ_Pantocrator.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/3/3c/Virgin_Hodegetria.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/0/0f/Jesus_Christ_Pantocrator_Sinai.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/7/79/Christ_Pantocrator_Daphni.jpg"
];

export default function App() {
  const [verse, setVerse] = useState("Tap below to receive a blessing 🙏");
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    requestPermissions();
    scheduleDailyNotifications();
  }, []);

  // Get random verse + change image
  const refreshContent = () => {
    const randomVerse = Math.floor(Math.random() * verses.length);
    const nextImage = (imageIndex + 1) % images.length;

    setVerse(verses[randomVerse]);
    setImageIndex(nextImage);
  };

  async function requestPermissions() {
    await Notifications.requestPermissionsAsync();
  }

  async function scheduleDailyNotifications() {
    const times = [
      { hour: 6, minute: 0 },
      { hour: 9, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 18, minute: 0 },
      { hour: 21, minute: 0 },
      { hour: 23, minute: 0 },
    ];

    times.forEach(async (time, index) => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🙏 Prayer Time",
          body: verses[index % verses.length],
        },
        trigger: {
          hour: time.hour,
          minute: time.minute,
          repeats: true,
        },
      });
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🙏 Orthodox Prayer</Text>

      <Image source={{ uri: images[imageIndex] }} style={styles.image} />

      <Text style={styles.verse}>{verse}</Text>

      <TouchableOpacity style={styles.button} onPress={refreshContent}>
        <Text style={styles.buttonText}>Receive Blessing ✨</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    fontWeight: "bold",
    color: "#facc15",
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#facc15",
  },
  verse: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#e2e8f0",
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#facc15",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});