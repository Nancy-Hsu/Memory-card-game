////five states of game
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

//// symbols for cards
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

////小工具 - 洗牌(放入長度，回傳洗過的陣列)
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (index = number.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

//// about view 
const view = {

  //// 放入index，回傳卡背
  getCardElement(index) {
    return `<div data-index=${index} class="card back"></div>`
  },

  //// 先決定數字，再決定花色
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbols = Symbols[Math.floor(index / 13)]
    return `<p>${number}</p>
    <img src= ${symbols} >
    <p>${number}</p>`
  },

  ////特殊案例用SWITCH，不用逗號
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  ////抓到div.cards，map 似 forEach 但會回傳新陣列
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  ////翻牌帶入card 再擷取dataset.index，背翻正，正翻背
  flipCards(...cards) {
    cards.map(card => {
      const index = Number(card.dataset.index)
      //// 背翻正
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(index)
        return
      }
      ////正翻背
      card.innerHTML = null
      card.classList.add('back')
    })

  },
  pairCards(...cards) {
    cards.map(card => card.classList.add('paired')
    )
  },
  renderScore(score) {
    document.querySelector('.score').textContent = `score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },

  ////增加閃黃框，設立一次性事件，動畫結束就移除class
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => {
        card.classList.remove('wrong'), { once: true }
      })
    })
  },
  ////破關後的顯示功能
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML =`<div class="end-notification">
    <h1>Congratulations !</h1>
    <p>You have done a good job</p><br> 
    <p>--------------------------------------------</p>
    <p class="final-score">Your score: ${model.score} full- score</p>
    <p class="final-tries">You have tried ${model.triedTimes} times</p>
    
    <p>--------------------------------------------</p>

  </div>`
    const header = document.querySelector('#header')
    header.before(div)
  }
}


const model = {
  //// 暫存card的陣列，呼叫要加this
  revealedCards: [],
  isRevealedCardsMatched() {
    ////記得 % 13 才是 number
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0,

}

//// 店員身分，負責呼叫各區域的程式
const controller = {
  ////先制定currentState，在物件裡所以是冒號
  currentState: GAME_STATE.FirstCardAwaits,
 
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  ////呼叫翻牌，清空，改狀態
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  },
  ////派發功能的中心
  dispatchCardAction(card) {
    ////不是背面的牌 return
    if (!card.matches('.back')) return

    //case 都用GAME_STATE.keys()
    switch (this.currentState) {

      //，呼叫翻牌，加入暫存，更改狀態
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      ////點擊第二張牌，呼叫翻牌，加入暫存，並判斷更改狀態為SecondCardAwaits
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        //用資料的函示判斷兩個相同的話進入
        ////會直接取用此暫存資料，所以不用參數
        if (model.isRevealedCardsMatched()) {
          ////matched得10分、改狀態、改背景顏色、清空暫存、狀態重來
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []  
          view.renderScore(model.score += 10)

          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          ////not matched 改狀態
          this.currentState = GAME_STATE.CardsMatchFailed

          ////一秒後做
          setTimeout(this.resetCards, 1000);
          view.appendWrongAnimation(...model.revealedCards)
        }
    }
  }

}


////由controller的函示呼叫dispaly和一個洗亂的
controller.generateCards()


////每個card都加上事件，這裡不可用map
document.querySelectorAll('.card').forEach(card => card.addEventListener('click', event => {
  controller.dispatchCardAction(card)
}))



