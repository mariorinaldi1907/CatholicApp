import { View, Text, StyleSheet } from 'react-native';
export default function Confession(){ return <View style={s.wrap}><Text style={s.h1}>Confession</Text></View>; }
const s = StyleSheet.create({ wrap:{flex:1,padding:16}, h1:{fontSize:22,fontWeight:'700'} });