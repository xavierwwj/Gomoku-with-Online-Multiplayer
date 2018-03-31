/* BOILERPLATE */
import React, { Component } from 'react';
import {
  View, TouchableOpacity, Dimensions, Text, TextInput
} from 'react-native';
import PinchZoomView from 'react-native-pinch-zoom-view';
import { Scene, Router, Stack, Actions } from 'react-native-router-flux';
import firebase from 'firebase';

/** FIREBASE SETUP */
var config = {
  apiKey: "AIzaSyArLmgvvb9Ef9ST8VC3hjG-Y7DR0deE-Ng",
  authDomain: "gomoku-eb623.firebaseapp.com",
  databaseURL: "https://gomoku-eb623.firebaseio.com",
  projectId: "gomoku-eb623",
  storageBucket: "",
  messagingSenderId: "1063645421059"
};
firebase.initializeApp(config);

/* CONSTANTS */
const height = Dimensions.get('window').height;
const width = Dimensions.get('window').width;
const BOARD_SIZE = 13;
const GRID_SIZE = width / BOARD_SIZE - 2;

/* This section controls the game logic for the board game 'Gomoku' */
function Board(size) {
  this.size = size;
  this.EMPTY = 0;
  this.BLACK = 1;
  this.WHITE = 2;
  this.current_color = this.BLACK;

  this.create_board = function (size) {
    var m = [];
    for (var i = 0; i < size; i++) {
      m[i] = [];
      for (var j = 0; j < size; j++) {
        m[i][j] = this.EMPTY;
      }
    }
    return m;
  };

  this.switch_player = function () {
    this.current_color =
      this.current_color == this.BLACK ? this.WHITE : this.BLACK;
  };

  this.board = this.create_board(size);
};



/** The following code will define the UI Elements of Gomoku */

/** First we define a single intersection */
class BoardIntersection extends Component {
  handleClick() {
    this.props.board.board[this.props.row][this.props.col] = this.props.board.current_color;
    this.props.board.switch_player();
    //this.props.onPlay(this.props.board);
    /** UPDATE FIREBASE HERE */
    firebase.database().ref(`${this.props.roomID}`).set({
      current_color: this.props.board.current_color,
      board: this.props.board.board

    })
  }
  decideColor() {
    if (this.props.board.board[this.props.row][this.props.col] == this.props.board.EMPTY) {
      return (
        <TouchableOpacity
          onPress={() => this.handleClick()}
          style={{
            width: GRID_SIZE,
            height: GRID_SIZE,
            position: 'absolute',
            left: GRID_SIZE * this.props.row,
            top: GRID_SIZE * this.props.col
          }}>
          <View style={styles.horizontalStyle} />
          <View style={styles.verticalStyle} />
        </TouchableOpacity>
      );
    }
    else if (this.props.board.board[this.props.row][this.props.col] == this.props.board.WHITE) {
      return (
        <View style={{
          ...styles.whiteStoneStyle, left: GRID_SIZE * this.props.row,
          top: GRID_SIZE * this.props.col
        }} />
      );
    }
    else if (this.props.board.board[this.props.row][this.props.col] == this.props.board.BLACK) {
      return (
        <View style={{
          ...styles.blackStoneStyle, left: GRID_SIZE * this.props.row,
          top: GRID_SIZE * this.props.col
        }} />
      );
    }
  }
  render() {
    return this.decideColor();
  }
}

/** Now we define our whole BoardView made up of n x n intersections */
class BoardView extends Component {
  funk() {
    var intersections = [];
    for (var i = 0; i < this.props.board.size; i++) {
      for (var j = 0; j < this.props.board.size; j++) {
        intersections.push(<BoardIntersection
          key={i.toString() + i.toString() + j.toString()}
          board={this.props.board}
          row={i}
          col={j}
          //onPlay={this.props.onPlay}
          roomID={this.props.roomID}
        />);
      }
    }
    return intersections;
  }
  render() {
    return this.funk();
  }
}

class Gomoku extends Component {
  constructor(props) {
    super(props);
    this.state = { board: new Board(BOARD_SIZE) };
  }
  uploadData(snapshot) {
    var tempBoard = new Board(13);
    tempBoard.current_color = snapshot.val().current_color;
    tempBoard.board = snapshot.val().board;
    this.setState({ board: tempBoard })
  }
  componentWillMount() {
    firebase.database().ref(`${this.props.roomID}/`).on(
      'value', this.uploadData.bind(this));
  }

  render() {
    return (
      <PinchZoomView>
        <Text>{this.props.roomID}</Text>
        <View style={styles.boardStyle}>
          <BoardView board={this.state.board} roomID={this.props.roomID}/>
        </View>
      </PinchZoomView>
    );
  }
}

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = { text: '' };
  }

  createRoom() {
    var board = new Board(13);
    var roomID = Math.floor(Math.random()*1000000000)
    firebase.database().ref(`${roomID}`).set({
      current_color: board.current_color,
      board: board.board

    })
    Actions.board({roomID: roomID});
  }
  render() {
    return (
      <View style={{ marginTop: 250, marginBottom: 250,flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', flex: 1 }}>
        <TouchableOpacity
          style={{borderColor:'black', borderWidth: 2}}
          onPress={()=>this.createRoom()}
        >
          <Text style={{width: 180, textAlign: 'center'}}>
            CREATE ROOM
          </Text>
        </TouchableOpacity>
        <TextInput 
          placeholder='ENTER ROOM ID BELOW'
          style={{height: 30, width: 180, borderColor: 'gray', textAlign: 'center', borderWidth: 2}}
          onChangeText={(text) => this.setState({text})}
          value={this.state.text}
        />
        <TouchableOpacity
          onPress={() => Actions.board({roomID: this.state.text})}
          style={{borderColor:'black', borderWidth: 2}}
        >
          <Text style={{width: 180, textAlign: 'center'}}>
            CLICK TO ENTER ROOM
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

export default class App extends Component {
  render() {
    return (
      <Router>
        <Stack key="root">
          <Scene key="main" component={Main} hideNavBar panHandlers={null} />
          <Scene key="board" component={Gomoku} hideNavBar panHandlers={null} />
        </Stack>
      </Router>
    );
  }
}



const styles = {
  boardStyle: {
    position: 'relative',
    alignSelf: 'center',
    width: GRID_SIZE * BOARD_SIZE,
    height: GRID_SIZE * BOARD_SIZE,
    backgroundColor: '#8b5a2b'
  },
  horizontalStyle: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderTopWidth: 2,
    borderColor: 'black',
    position: 'absolute',
    top: (GRID_SIZE - 2) / 2
  },
  verticalStyle: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderLeftWidth: 2,
    borderColor: 'black',
    position: 'absolute',
    left: (GRID_SIZE - 2) / 2
  },
  blackStoneStyle: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 20,
    backgroundColor: '#444444',
    borderColor: 'black',
    borderWidth: 1,
    position: 'absolute'
  },
  whiteStoneStyle: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 20,
    backgroundColor: '#eeeeee',
    borderColor: 'black',
    borderWidth: 1,
    position: 'absolute'
  }
};
