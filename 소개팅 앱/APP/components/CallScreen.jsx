import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDirectCall } from '@/libs/sendbird/hooks/useDirectCall';

export const CallScreen = ({ calleeId, onCallEnd }) => {
  const {
    isCallActive,
    startCall,
    endCall,
    acceptCall,
    rejectCall,
  } = useDirectCall({
    onCallStarted: () => {
      console.log('통화가 시작되었습니다.');
    },
    onCallEnded: () => {
      console.log('통화가 종료되었습니다.');
      onCallEnd();
    },
    onCallAccepted: () => {
      console.log('통화가 수락되었습니다.');
    },
    onCallRejected: () => {
      console.log('통화가 거절되었습니다.');
      onCallEnd();
    },
  });

  React.useEffect(() => {
    startCall(calleeId);
  }, [calleeId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>통화 중...</Text>
      <Text style={styles.subtitle}>{calleeId}와 통화 중입니다.</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.endButton]}
          onPress={endCall}
        >
          <Text style={styles.buttonText}>통화 종료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    padding: 15,
    borderRadius: 25,
    width: 150,
    alignItems: 'center',
  },
  endButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 