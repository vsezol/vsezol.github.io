(this["webpackJsonpreact-quiz"]=this["webpackJsonpreact-quiz"]||[]).push([[0],[,,,,,function(e,t,n){e.exports={FinishedQuiz:"FinishedQuiz_FinishedQuiz__tNfpy",success:"FinishedQuiz_success__1vLYL",error:"FinishedQuiz_error__3_FK1"}},function(e,t,n){e.exports={MenuToggle:"MenuToggle_MenuToggle__3o5X8",open:"MenuToggle_open__2TrVH"}},function(e,t,n){e.exports={Drawer:"Drawer_Drawer__2JMlk",close:"Drawer_close__3PDrT",active:"Drawer_active__2trNl"}},,function(e,t,n){e.exports={Quiz:"Quiz_Quiz__dGnER",QuizWrapper:"Quiz_QuizWrapper__281c4"}},function(e,t,n){e.exports={ActiveQuiz:"ActiveQuiz_ActiveQuiz__HC8vq",Question:"ActiveQuiz_Question__2alnG"}},function(e,t,n){e.exports={AnswerItem:"AnswerItem_AnswerItem__1HlyK",success:"AnswerItem_success__3k83r",error:"AnswerItem_error__1B5Ey"}},function(e,t,n){e.exports={Button:"Button_Button__5kOLZ",error:"Button_error__1kyU8",success:"Button_success__2swve",primary:"Button_primary__gKYpZ"}},,,function(e,t,n){e.exports={Layout:"Layout_Layout__1D_0e"}},function(e,t,n){e.exports={Backdrop:"Backdrop_Backdrop__1gi2A"}},function(e,t,n){e.exports={AnswersList:"AnswersList_AnswersList__JlcPQ"}},function(e,t,n){e.exports=n(24)},,,,,function(e,t,n){},function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),s=n(14),i=n.n(s),u=(n(23),n(1)),c=n(2),l=n(3),o=n(4),d=n(15),m=n.n(d),p=n(6),h=n.n(p),w=function(e){var t=[h.a.MenuToggle,"fa"];return e.isOpen?(t.push("fa-times"),t.push(h.a.open)):t.push("fa-bars"),r.a.createElement("i",{className:t.join(" "),onClick:e.onToggle})},_=n(7),f=n.n(_),v=n(16),x=n.n(v),E=function(e){return r.a.createElement("div",{className:x.a.Backdrop,onClick:e.onClick})},g=["\u0417\u0430\u0447\u0435\u043c","\u0442\u044b","\u0441\u044e\u0434\u0430","\u0437\u0430\u0448\u0435\u043b?"],z=function(e){Object(o.a)(n,e);var t=Object(l.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,s=new Array(a),i=0;i<a;i++)s[i]=arguments[i];return(e=t.call.apply(t,[this].concat(s))).renderLinks=function(){return g.map((function(e,t){return r.a.createElement("li",{key:t},r.a.createElement("a",null,e))}))},e}return Object(c.a)(n,[{key:"render",value:function(){var e=[f.a.Drawer];return this.props.isOpen||e.push(f.a.close),r.a.createElement(r.a.Fragment,null,r.a.createElement("nav",{className:e.join(" ")},r.a.createElement("ul",null,this.renderLinks())),this.props.isOpen?r.a.createElement(E,{onClick:this.props.onClose}):null)}}]),n}(a.Component),k=function(e){Object(o.a)(n,e);var t=Object(l.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),s=0;s<a;s++)r[s]=arguments[s];return(e=t.call.apply(t,[this].concat(r))).state={menu:!0},e.toggleMenuHandler=function(){e.setState({menu:!e.state.menu})},e.menuCloseHandler=function(){e.setState({menu:!1})},e}return Object(c.a)(n,[{key:"render",value:function(){return r.a.createElement("div",{className:m.a.Layout},r.a.createElement(z,{isOpen:this.state.menu,onClose:this.menuCloseHandler}),r.a.createElement(w,{onToggle:this.toggleMenuHandler,isOpen:this.state.menu}),r.a.createElement("main",null,this.props.children))}}]),n}(a.Component),y=n(8),A=n(9),Q=n.n(A),b=n(10),q=n.n(b),j=n(17),C=n.n(j),O=n(11),S=n.n(O),N=function(e){var t=[S.a.AnswerItem];return e.answerState&&t.push(S.a[e.answerState]),r.a.createElement("li",{className:t.join(" "),onClick:function(){return e.onAnswerClick(e.answer.id)}},e.answer.text)},I=function(e){return r.a.createElement("ul",{className:C.a.AnswersList},e.answers.map((function(t,n){return r.a.createElement(N,{key:n,answer:t,onAnswerClick:e.onAnswerClick,answerState:e.answerState?e.answerState[t.id]:null})})))},L=function(e){return r.a.createElement("div",{className:q.a.ActiveQuiz},r.a.createElement("p",{className:q.a.Question},r.a.createElement("span",null,r.a.createElement("strong",null,e.question)),r.a.createElement("small",null,e.questionNumber,"/",e.quizLength)),r.a.createElement(I,{answers:e.answers,onAnswerClick:e.onAnswerClick,answerState:e.answerState}))},F=n(5),B=n.n(F),H=n(12),M=n.n(H),T=function(e){var t=[M.a.Button,M.a[e.type]];return r.a.createElement("button",{onClick:e.onClick,className:t.join(" "),disabled:e.disabled},e.children)},D=function(e){var t=Object.keys(e.results).reduce((function(t,n){return"success"===e.results[n]&&t++,t}),0);return r.a.createElement("div",{className:B.a.FinishedQuiz},r.a.createElement("h2",null,"\u0421\u043f\u0430\u0441\u0438\u0431\u043e, \u0447\u0442\u043e \u043f\u043e\u0442\u0440\u0430\u0442\u0438\u043b\u0438 \u0441\u0432\u043e\u0435 \u0432\u0440\u0435\u043c\u044f \u043d\u0430 \u044d\u0442\u0443 \u0437\u043b\u043e\u0435\u0431\u0443\u0447\u0443\u044e \u0445\u0435\u0440\u044c!"),r.a.createElement("ul",null,e.quiz.map((function(t,n){var a=["fa","error"===e.results[t.id]?"fa-times "+B.a.error:"fa-check "+B.a.success];return r.a.createElement("li",{key:n},r.a.createElement("strong",null,n+1,"."),"\xa0",t.question,r.a.createElement("i",{className:a.join(" ")}))}))),r.a.createElement("p",null,"\u041f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e ",t,"/",e.quiz.length),r.a.createElement("div",null,r.a.createElement(T,{onClick:e.onRetry,type:"primary"},"\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c"),r.a.createElement(T,{onClick:e.onRetry,type:"success"},"\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u0441\u043f\u0438\u0441\u043e\u043a \u0442\u0435\u0441\u0442\u043e\u0432")))},J=function(e){Object(o.a)(n,e);var t=Object(l.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),s=0;s<a;s++)r[s]=arguments[s];return(e=t.call.apply(t,[this].concat(r))).state={results:{},isFinished:!1,activeQuestion:0,answerState:null,quiz:[{question:"\u041a\u0430\u043a\u043e\u0439 \u0434\u043b\u0438\u043d\u044b \u0443 \u0442\u0435\u0431\u044f \u0445\u043e\u0445\u043e\u0440\u044f\u0448\u043a\u0438?",rightAnswerId:4,id:1,answers:[{text:"0 \u0441\u043c",id:1},{text:"\u0434\u043e 1 \u0441\u043c",id:2},{text:"1-5 \u0441\u043c",id:3},{text:"\u042f \u0442\u044f\u043d \u043f\u0440\u0443\u0444i\u0432 \u043d\u0435 \u0431\u0443\u0434\u0435\u0442",id:4}]},{question:"\u0412\u044b\u0431\u0435\u0440\u0435\u0442\u0435 \u043d\u0430\u0438\u043b\u0443\u0447\u0448\u0438\u0439 \u0438\u0433\u0440\u043e\u0432\u043e\u0439 \u043d\u0438\u043a",rightAnswerId:2,id:2,answers:[{text:"opa_chin_chopa",id:1},{text:"popajopa",id:2},{text:"zhmih",id:3},{text:"pizdolaz",id:4}]},{question:"\u0422\u044b \u0443\u043f\u0430\u043b \u0432 \u044f\u043c\u0443. \u0412 \u044f\u043c\u0435 \u043f\u0438\u0440\u043e\u0436\u043e\u043a \u0438 \u0445\u0443\u0439. \u0427\u0442\u043e \u0441\u044a\u0435\u0448\u044c, \u0447\u0442\u043e \u0432 \u0436\u043e\u043f\u0443 \u0437\u0430\u0441\u0443\u043d\u0435\u0448\u044c?",rightAnswerId:2,id:3,answers:[{text:"\u0416\u043e\u043f\u0443 \u043f\u0438\u0440\u043e\u0436\u043a\u043e\u043c \u0437\u0430\u043a\u0440\u043e\u044e, \u0430 \u0445\u0443\u0439 \u0432 \u0440\u043e\u0442 \u043d\u0435 \u0441\u0442\u0430\u043d\u0443 \u0431\u0440\u0430\u0442\u044c",id:1},{text:"\u0412\u043e\u0437\u044c\u043c\u0443 \u043f\u0438\u0440\u043e\u0436\u043e\u043a \u0438 \u0432\u044b\u043b\u0435\u0437\u0443 \u0438\u0437 \u044f\u043c\u044b",id:2},{text:"\u0418\u0437 \u043a\u0430\u0436\u0434\u043e\u0439 \u044f\u043c\u044b \u043c\u043e\u0436\u043d\u043e \u0432\u044b\u043b\u0435\u0437\u0442\u0438",id:3},{text:"\u041a\u043e\u043d\u0435\u0447\u043d\u043e \u0445\u0443\u0435\u043a \u0432 \u0440\u043e\u0442, \u0430 \u043f\u0438\u0440\u043e\u0433 \u0432 \u0436\u043e\u043f\u0443",id:4}]},{question:"\u0427\u0442\u043e \u0431\u044b\u043b\u043e \u0440\u0430\u043d\u044c\u0448\u0435, \u043a\u0443\u0440\u0438\u0446\u0430 \u0438\u043b\u0438 vsezol?",rightAnswerId:3,id:3,answers:[{text:"\u043a\u0443\u0440\u0438\u0446\u0430",id:1},{text:"1.5 \u043a\u0443\u0440\u0438\u0446\u044b",id:2},{text:"vsezol",id:3},{text:"\u044f\u0439\u0446\u043e",id:4}]},{question:"\u0420\u044f\u0434\u043e\u043c \u0434\u0432\u0430 \u0441\u0442\u0443\u043b\u0430, \u043d\u0430 \u043e\u0434\u043d\u043e\u043c \u043f\u0438\u043a\u0438 \u0442\u043e\u0447\u0435\u043d\u044b\u0435, \u043d\u0430 \u0434\u0440\u0443\u0433\u043e\u043c \u0445\u0443\u0438 \u0434\u0440\u043e\u0447\u0435\u043d\u044b\u0435, \u043a\u0443\u0434\u0430 \u0441\u0430\u043c \u0441\u044f\u0434\u0435\u0448\u044c, \u043a\u0443\u0434\u0430 \u043c\u0430\u0442\u044c \u043f\u043e\u0441\u0430\u0434\u0438\u0448\u044c?",rightAnswerId:2,id:3,answers:[{text:"\u0445\u0443\u0438 - \u043c\u0430\u0442\u044c, \u043f\u0438\u043a\u0438 - \u044f",id:1},{text:"\u0431\u043b\u044f\u0442\u044c",id:2},{text:"\u0445\u0443\u0438 - \u044f, \u043f\u0438\u043a\u0438 - \u043c\u0430\u0442\u044c",id:3},{text:"\u0412\u043e\u0437\u044c\u043c\u0443 \u043f\u0438\u043a\u0438 \u0442\u043e\u0447\u0435\u043d\u044b\u0435, \u0434\u0430 \u0441\u0440\u0443\u0431\u043b\u044e \u0445\u0443\u0438 \u0434\u0440\u043e\u0447\u0435\u043d\u044b\u0435",id:4}]},{question:"\u0412\u0435\u0434\u044c\u043c\u0430\u043a\u0443 \u0437\u0430\u043f\u043b\u0430\u0442\u0438\u0442\u0435 ... (\u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u0435 \u0444\u0440\u0430\u0437\u0443)",rightAnswerId:4,id:3,answers:[{text:"\u0444\u0430\u043b\u044c\u0448\u0438\u0432\u043e\u0439 \u043c\u043e\u043d\u0435\u0442\u043e\u0439",id:1},{text:"\u043d\u0438\u0447\u0435\u0433\u043e",id:2},{text:"\u0447\u0435\u043a\u0430\u043d\u043e\u0439 \u043a\u043e\u043f\u0435\u0439\u043a\u043e\u0439",id:3},{text:"three hundred bucks",id:4}]},{question:"Minecraft, \u0415\u0413\u042d, \u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435, \u0414\u0440\u043e\u0447 (\u0443\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0438\u0448\u043d\u0435\u0435 \u0441\u043b\u043e\u0432\u043e)",rightAnswerId:1,id:3,answers:[{text:"\u0415\u0413\u042d",id:1},{text:"\u0414\u0440\u043e\u0447",id:2},{text:"\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435",id:3},{text:"Minecraft",id:4}]},{question:"\u041f\u043e\u0447\u0435\u043c\u0443 \u0443 \u0447\u0435\u043b\u043e\u0432\u0435\u043a\u0430 \u0433\u0440\u0443\u0441\u0442\u043d\u043e\u0435 \u0435\u0431\u0430\u043b\u043e?",rightAnswerId:3,id:3,answers:[{text:"\u042f \u0447\u0435 \u0435\u0431\u0443?",id:1},{text:"\u041f\u043e\u0442\u043e\u043c\u0443 \u0447\u0442\u043e",id:2},{text:"\u0425\u043e\u0447\u0435\u0442 \u0441\u0440\u0430\u0442\u044c, \u043d\u043e \u0434\u0430\u043b\u044c\u0448\u0435 \u043a\u0443\u0440\u0438\u0442",id:3},{text:"\u0423\u0434\u0430\u0440\u0438\u043b\u0441\u044f \u0447\u043b\u0435\u043d\u043e\u043c \u043e\u0431 \u0448\u043a\u0430\u0444",id:4}]}]},e.onAnswerClickHandler=function(t){if(e.state.answerState){var n=Object.keys(e.state.answerState)[0];if("success"===e.state.answerState[n])return}var a=e.state.quiz[e.state.activeQuestion],r=e.state.results;if(a.rightAnswerId===t){r[a.id]||(r[a.id]="success",console.log(r)),e.setState({answerState:Object(y.a)({},t,"success"),results:r});var s=setTimeout((function(){e.isQuizFinished()?e.setState({isFinished:!0}):e.setState({activeQuestion:e.state.activeQuestion+1,answerState:null}),clearTimeout(s)}),1e3)}else r[a.id]="error",e.setState({answerState:Object(y.a)({},t,"error"),results:r})},e.isQuizFinished=function(){return e.state.activeQuestion+1===e.state.quiz.length},e.retryHandler=function(){e.setState({activeQuestion:0,isFinished:0,answerState:null,results:{}})},e}return Object(c.a)(n,[{key:"render",value:function(){return r.a.createElement("div",{className:Q.a.Quiz},r.a.createElement("div",{className:Q.a.QuizWrapper},r.a.createElement("h1",null,"Quizer"),this.state.isFinished?r.a.createElement(D,{results:this.state.results,quiz:this.state.quiz,onRetry:this.retryHandler}):r.a.createElement(L,{question:this.state.quiz[this.state.activeQuestion].question,answers:this.state.quiz[this.state.activeQuestion].answers,onAnswerClick:this.onAnswerClickHandler,quizLength:this.state.quiz.length,questionNumber:this.state.activeQuestion+1,answerState:this.state.answerState})))}}]),n}(a.Component),R=function(e){Object(o.a)(n,e);var t=Object(l.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(c.a)(n,[{key:"render",value:function(){return r.a.createElement(k,null,r.a.createElement(J,null))}}]),n}(a.Component);i.a.render(r.a.createElement(r.a.StrictMode,null,r.a.createElement(R,null)),document.getElementById("root"))}],[[18,1,2]]]);
//# sourceMappingURL=main.c4da4e2c.chunk.js.map