(this["webpackJsonpreact-quiz"]=this["webpackJsonpreact-quiz"]||[]).push([[0],{15:function(e,t,n){e.exports={Drawer:"Drawer_Drawer__2JMlk",close:"Drawer_close__3PDrT",active:"Drawer_active__2trNl"}},16:function(e,t,n){e.exports={Auth:"Auth_Auth__1i2HE",AuthForm:"Auth_AuthForm__1lIXG",buttonDiv:"Auth_buttonDiv__1R2vd"}},17:function(e,t,n){e.exports={FinishedQuiz:"FinishedQuiz_FinishedQuiz__tNfpy",success:"FinishedQuiz_success__1vLYL",error:"FinishedQuiz_error__3_FK1"}},19:function(e,t,n){e.exports={MenuToggle:"MenuToggle_MenuToggle__3o5X8",open:"MenuToggle_open__2TrVH"}},22:function(e,t,n){e.exports={Button:"Button_Button__5kOLZ",error:"Button_error__1kyU8",success:"Button_success__2swve",primary:"Button_primary__gKYpZ"}},23:function(e,t,n){e.exports={Input:"Input_Input__1b7hh",invalid:"Input_invalid__-qoX2"}},24:function(e,t,n){e.exports={Quiz:"Quiz_Quiz__dGnER",QuizWrapper:"Quiz_QuizWrapper__281c4"}},25:function(e,t,n){e.exports={ActiveQuiz:"ActiveQuiz_ActiveQuiz__HC8vq",Question:"ActiveQuiz_Question__2alnG"}},26:function(e,t,n){e.exports={AnswerItem:"AnswerItem_AnswerItem__1HlyK",success:"AnswerItem_success__3k83r",error:"AnswerItem_error__1B5Ey"}},27:function(e,t,n){e.exports={QuizList:"QuizList_QuizList__1EE1-",error:"QuizList_error__1lz_9"}},40:function(e,t,n){e.exports={Layout:"Layout_Layout__1D_0e"}},41:function(e,t,n){e.exports={Backdrop:"Backdrop_Backdrop__1gi2A"}},45:function(e,t,n){e.exports={AnswersList:"AnswersList_AnswersList__JlcPQ"}},47:function(e,t,n){e.exports={QuizCreator:"QuizCreator_QuizCreator__2RC8u"}},48:function(e,t,n){e.exports={Select:"Select_Select__3_KrV"}},50:function(e,t,n){e.exports=n(79)},55:function(e,t,n){},78:function(e,t,n){},79:function(e,t,n){"use strict";n.r(t);var a=n(0),r=n.n(a),i=n(39),s=n.n(i),l=n(8),u=(n(55),n(1)),o=n(2),c=n(3),m=n(4),d=n(40),h=n.n(d),v=n(19),p=n.n(v),f=function(e){var t=[p.a.MenuToggle,"fa"];return e.isOpen?(t.push("fa-times"),t.push(p.a.open)):t.push("fa-bars"),r.a.createElement("i",{className:t.join(" "),onClick:e.onToggle})},E=n(15),_=n.n(E),g=n(41),b=n.n(g),y=function(e){return r.a.createElement("div",{className:b.a.Backdrop,onClick:e.onClick})},w=[{to:"/",label:"\u0421\u043f\u0438\u0441\u043e\u043a",exact:!0},{to:"/auth",label:"\u0410\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044f",exact:!1},{to:"/quiz-creator",label:"\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0442\u0435\u0441\u0442",exact:!1}],z=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,i=new Array(a),s=0;s<a;s++)i[s]=arguments[s];return(e=t.call.apply(t,[this].concat(i))).renderLinks=function(){return w.map((function(t,n){return r.a.createElement("li",{key:n},r.a.createElement(l.c,{to:t.to,exact:t.exact,activeClassName:_.a.active,onClick:e.props.onClose},t.label))}))},e}return Object(o.a)(n,[{key:"render",value:function(){var e=[_.a.Drawer];return this.props.isOpen||e.push(_.a.close),r.a.createElement(r.a.Fragment,null,r.a.createElement("nav",{className:e.join(" ")},r.a.createElement("ul",null,this.renderLinks())),this.props.isOpen?r.a.createElement(y,{onClick:this.props.onClose}):null)}}]),n}(a.Component),C=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return(e=t.call.apply(t,[this].concat(r))).state={menu:!1},e.toggleMenuHandler=function(){e.setState({menu:!e.state.menu})},e.menuCloseHandler=function(){e.setState({menu:!1})},e}return Object(o.a)(n,[{key:"render",value:function(){return r.a.createElement("div",{className:h.a.Layout},r.a.createElement(z,{isOpen:this.state.menu,onClose:this.menuCloseHandler}),r.a.createElement(f,{onToggle:this.toggleMenuHandler,isOpen:this.state.menu}),r.a.createElement("main",null,this.props.children))}}]),n}(a.Component),k=n(11),j=n(10),Q=n(16),q=n.n(Q),O=n(22),A=n.n(O),x=function(e){var t=[A.a.Button,A.a[e.type]];return r.a.createElement("button",{onClick:e.onClick,className:t.join(" "),disabled:e.disabled},e.children)},S=n(23),H=n.n(S),F=function(e){var t=e.valid,n=e.touched,a=e.shouldValidate;return!t&&a&&n},N=function(e){var t=e.type||"text",n=[H.a.Input],a="".concat(t,"-").concat(Math.round(1e3*Math.random()));return F(e)&&n.push(H.a.invalid),r.a.createElement("div",{className:n.join(" ")},r.a.createElement("label",{htmlFor:a},e.label,F(e)?r.a.createElement("span",null,e.errorMessage||": incorrect value"):null),r.a.createElement("input",{type:t,id:a,value:e.value,onChange:e.onChange}))},L=n(44),I=n.n(L),M=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return(e=t.call.apply(t,[this].concat(r))).state={isFormValid:!1,formControls:{email:{value:"",type:"email",label:"Email",errorMessage:": incorrect email",valid:!1,touched:!1,shouldValidate:!0,validation:{required:!0,email:!0}},password:{value:"",type:"password",label:"Password",errorMessage:": incorrect password",valid:!1,touched:!1,shouldValidate:!0,validation:{required:!0,minLength:6}}}},e.loginHandler=function(){},e.registerHandler=function(){},e.submitHandler=function(e){return e.preventDefault()},e.validateControl=function(e,t){if(!t)return!0;var n=!0;return t.required&&(n=""!==e.trim()&&n),t.email&&(n=I.a.email(e)&&n),t.minLength&&(n=e.length>=t.minLength&&n),n},e.onChangeHandler=function(t,n){var a=Object(j.a)({},e.state.formControls),r=Object(j.a)({},a[n]);r.value=t.target.value,r.touched=!0,r.valid=e.validateControl(r.value,r.validation),a[n]=r;var i=!0;Object.keys(a).forEach((function(e){i=a[e].valid&&i})),e.setState({formControls:a,isFormValid:i})},e}return Object(o.a)(n,[{key:"renderInputs",value:function(){var e=this;return Object.keys(this.state.formControls).map((function(t,n){var a=e.state.formControls[t];return r.a.createElement(N,{key:t+n,type:a.type,value:a.value,valid:a.valid,touched:a.touched,label:a.label,shouldValidate:!!a.shouldValidate,errorMessage:a.errorMessage,onChange:function(n){return e.onChangeHandler(n,t)}})}))}},{key:"render",value:function(){return r.a.createElement("div",{className:q.a.Auth},r.a.createElement("div",null,r.a.createElement("h1",null,"Authorization"),r.a.createElement("form",{onSubmit:this.submitHandler,className:q.a.AuthForm},r.a.createElement("div",null,this.renderInputs()),r.a.createElement("div",{className:q.a.buttonDiv},r.a.createElement(x,{type:"success",onClick:this.loginHandler,disabled:!this.state.isFormValid},"Sign in"),r.a.createElement(x,{type:"primary",onClick:this.registerHandler},"Sign up")))))}}]),n}(a.Component),D=n(9),V=n.n(D),B=n(12),T=n(14),R=n(24),J=n.n(R),K=n(25),P=n.n(K),G=n(45),W=n.n(G),X=n(26),U=n.n(X),Y=function(e){var t=[U.a.AnswerItem];return e.answerState&&t.push(U.a[e.answerState]),r.a.createElement("li",{className:t.join(" "),onClick:function(){return e.onAnswerClick(e.answer.id)}},e.answer.text)},Z=function(e){return r.a.createElement("ul",{className:W.a.AnswersList},e.answers.map((function(t,n){return r.a.createElement(Y,{key:n,answer:t,onAnswerClick:e.onAnswerClick,answerState:e.answerState?e.answerState[t.id]:null})})))},$=function(e){return r.a.createElement("div",{className:P.a.ActiveQuiz},r.a.createElement("p",{className:P.a.Question},r.a.createElement("span",null,r.a.createElement("strong",null,e.question)),r.a.createElement("small",null,e.questionNumber,"/",e.quizLength)),r.a.createElement(Z,{answers:e.answers,onAnswerClick:e.onAnswerClick,answerState:e.answerState}))},ee=n(17),te=n.n(ee),ne=function(e){var t=Object.keys(e.results).reduce((function(t,n){return"success"===e.results[n]&&t++,t}),0);return r.a.createElement("div",{className:te.a.FinishedQuiz},r.a.createElement("h2",null,"\u0421\u043f\u0430\u0441\u0438\u0431\u043e, \u0447\u0442\u043e \u043f\u043e\u0442\u0440\u0430\u0442\u0438\u043b\u0438 \u0441\u0432\u043e\u0435 \u0432\u0440\u0435\u043c\u044f \u043d\u0430 \u044d\u0442\u0443 \u0437\u043b\u043e\u0435\u0431\u0443\u0447\u0443\u044e \u0445\u0435\u0440\u044c!"),r.a.createElement("ul",null,e.quiz.map((function(t,n){var a=["fa","error"===e.results[t.id]?"fa-times "+te.a.error:"fa-check "+te.a.success];return r.a.createElement("li",{key:n},r.a.createElement("strong",null,n+1,"."),"\xa0",t.question,r.a.createElement("i",{className:a.join(" ")}))}))),r.a.createElement("p",null,"\u041f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u043e ",t,"/",e.quiz.length),r.a.createElement("div",null,r.a.createElement(x,{onClick:e.onRetry,type:"primary"},"\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c"),r.a.createElement(l.b,{to:"/"},r.a.createElement(x,{onClick:e.onRetry,type:"success"},"\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u0432 \u0441\u043f\u0438\u0441\u043e\u043a \u0442\u0435\u0441\u0442\u043e\u0432"))))},ae=n(46),re=n.n(ae).a.create({baseURL:"https://react-quiz-8fe1d.firebaseio.com/"}),ie=(n(78),function(){return r.a.createElement("div",{style:{textAlign:"center"}},r.a.createElement("div",{className:"lds-facebook"},r.a.createElement("div",null),r.a.createElement("div",null),r.a.createElement("div",null)))}),se=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return(e=t.call.apply(t,[this].concat(r))).state={results:{},isFinished:!1,activeQuestion:0,answerState:null,quiz:[],loading:!0},e.onAnswerClickHandler=function(t){if(e.state.answerState){var n=Object.keys(e.state.answerState)[0];if("success"===e.state.answerState[n])return}var a=e.state.quiz[e.state.activeQuestion],r=e.state.results;a.rightAnswerId===t?(r[a.id]||(r[a.id]="success"),e.setState({answerState:Object(T.a)({},t,"success"),results:r})):(r[a.id]="error",e.setState({answerState:Object(T.a)({},t,"error"),results:r}));var i=setTimeout((function(){e.isQuizFinished()?e.setState({isFinished:!0}):e.setState({activeQuestion:e.state.activeQuestion+1,answerState:null}),clearTimeout(i)}),1e3)},e.isQuizFinished=function(){return e.state.activeQuestion+1===e.state.quiz.length},e.retryHandler=function(){e.setState({activeQuestion:0,isFinished:0,answerState:null,results:{}})},e}return Object(o.a)(n,[{key:"componentDidMount",value:function(){var e=Object(B.a)(V.a.mark((function e(){var t,n;return V.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,re.get("/quizes/".concat(this.props.match.params.id,".json"));case 3:t=e.sent,n=t.data,this.setState({quiz:n,loading:!1}),e.next=10;break;case 8:e.prev=8,e.t0=e.catch(0);case 10:console.log("Quiz id = ".concat(this.props.match.params.id));case 11:case"end":return e.stop()}}),e,this,[[0,8]])})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",{className:J.a.Quiz},r.a.createElement("div",{className:J.a.QuizWrapper},r.a.createElement("h1",null,"Quizer"),this.state.loading?r.a.createElement(ie,null):this.state.isFinished?r.a.createElement(ne,{results:this.state.results,quiz:this.state.quiz,onRetry:this.retryHandler}):r.a.createElement($,{question:this.state.quiz[this.state.activeQuestion].question,answers:this.state.quiz[this.state.activeQuestion].answers,onAnswerClick:this.onAnswerClickHandler,quizLength:this.state.quiz.length,questionNumber:this.state.activeQuestion+1,answerState:this.state.answerState})))}}]),n}(a.Component),le=n(49),ue=n(47),oe=n.n(ue),ce=n(48),me=n.n(ce),de=function(e){var t="".concat(e.label,"-").concat(Math.random());return r.a.createElement("div",{className:me.a.Select},r.a.createElement("label",{htmlFor:t},e.label),r.a.createElement("select",{id:t,value:e.value,onChange:e.onChange},e.options.map((function(e,t){return r.a.createElement("option",{value:e.value,key:e.value+t},e.text)}))))};function he(e,t){return Object(j.a)({},e,{validation:t,valid:!t,touched:!1,value:""})}function ve(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(!t)return!0;var n=!0;return t.required&&(n=""!==e.trim()&&n),n}function pe(e){var t=!0;for(var n in e)e.hasOwnProperty(n)&&(t=e[n].valid&&t);return t}var fe=function(e){return e.children};function Ee(e){return he({label:"variant ".concat(e),errorMessage:"value should not be empty",id:e},{required:!0})}function _e(){return{question:he({label:"Question",errorMessage:"value should not be empty"},{required:!0}),option1:Ee(1),option2:Ee(2),option3:Ee(3),option4:Ee(4)}}var ge=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return(e=t.call.apply(t,[this].concat(r))).state={quiz:[],isFormValid:!1,rightAnswerId:1,formControls:_e()},e.sibmitHandler=function(e){e.preventDefault()},e.addQuestionHandler=function(t){t.preventDefault();var n=Object(le.a)(e.state.quiz),a=n.length+1,r=e.state.formControls,i=r.question,s=r.option1,l=r.option2,u=r.option3,o=r.option4,c={question:i.value,id:a,rightAnswerId:e.state.rightAnswerId,answers:[{text:s.value,id:s.id},{text:l.value,id:l.id},{text:u.value,id:u.id},{text:o.value,id:o.id}]};n.push(c),e.setState({quiz:n,isFormValid:!1,rightAnswerId:1,formControls:_e()})},e.createQuizHandler=function(){var t=Object(B.a)(V.a.mark((function t(n){return V.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return n.preventDefault(),t.prev=1,t.next=4,re.post("/quizes.json",e.state.quiz);case 4:e.setState({quiz:[],isFormValid:!1,rightAnswerId:1,formControls:_e()}),t.next=10;break;case 7:t.prev=7,t.t0=t.catch(1),console.log(t.t0);case 10:case"end":return t.stop()}}),t,null,[[1,7]])})));return function(e){return t.apply(this,arguments)}}(),e.changeHandler=function(t,n){var a=Object(j.a)({},e.state.formControls),r=Object(j.a)({},a[n]);r.touched=!0,r.value=t,r.valid=ve(r.value,r.validation),a[n]=r,e.setState({formControls:a,isFormValid:pe(a)})},e.selectChangeHandler=function(t){e.setState({rightAnswerId:+t.target.value})},e}return Object(o.a)(n,[{key:"renderControls",value:function(){var e=this;return Object.keys(this.state.formControls).map((function(t,n){var a=e.state.formControls[t];return r.a.createElement(fe,{key:t+n},r.a.createElement(N,{label:a.label,value:a.value,valid:a.valid,shouldValidate:!!a.validation,touched:a.touched,errorMessage:a.errorMessage,onChange:function(n){return e.changeHandler(n.target.value,t)}}),0===n?r.a.createElement("hr",null):null)}))}},{key:"render",value:function(){var e=r.a.createElement(de,{label:"Choose the right answer",value:this.state.rightAnswerId,onChange:this.selectChangeHandler,options:[{text:1,value:1},{text:2,value:2},{text:3,value:3},{text:4,value:4}]});return r.a.createElement("div",{className:oe.a.QuizCreator},r.a.createElement("div",null,r.a.createElement("h1",null,"Creating the quiz"),r.a.createElement("form",{onSubmit:this.submitHandler},this.renderControls(),e,r.a.createElement(x,{type:"primary",onClick:this.addQuestionHandler,disabled:!this.state.isFormValid},"Add question"),r.a.createElement(x,{type:"success",onClick:this.createQuizHandler,disabled:0===this.state.quiz.length},"Create quiz"))))}}]),n}(a.Component),be=n(27),ye=n.n(be),we=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){var e;Object(u.a)(this,n);for(var a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return(e=t.call.apply(t,[this].concat(r))).state={quizes:[],loading:!0,isEmpty:!1},e}return Object(o.a)(n,[{key:"renderQuizes",value:function(){return this.state.quizes.map((function(e){return r.a.createElement("li",{key:e.id},r.a.createElement(l.c,{to:"/quiz/".concat(e.id)},e.name))}))}},{key:"componentDidMount",value:function(){var e=Object(B.a)(V.a.mark((function e(){var t,n;return V.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,re.get("/quizes.json");case 3:t=e.sent,n=[],Object.keys(t.data).forEach((function(e,t){n.push({id:e,name:"Test \u2116 ".concat(t+1)})})),this.setState({quizes:n,loading:!1,isEmpty:!1}),e.next=12;break;case 9:e.prev=9,e.t0=e.catch(0),this.setState({loading:!1,isEmpty:!0});case 12:case"end":return e.stop()}}),e,this,[[0,9]])})));return function(){return e.apply(this,arguments)}}()},{key:"render",value:function(){return r.a.createElement("div",{className:ye.a.QuizList},r.a.createElement("div",null,r.a.createElement("h1",null,"Quiz list"),this.state.isEmpty?r.a.createElement("h2",{className:ye.a.error},"The list is empty"):null,this.state.loading?r.a.createElement(ie,null):r.a.createElement("ul",null,this.renderQuizes())))}}]),n}(a.Component),ze=function(e){Object(m.a)(n,e);var t=Object(c.a)(n);function n(){return Object(u.a)(this,n),t.apply(this,arguments)}return Object(o.a)(n,[{key:"render",value:function(){return r.a.createElement(C,null,r.a.createElement(k.c,null,r.a.createElement(k.a,{path:"/auth",component:M}),r.a.createElement(k.a,{path:"/quiz-creator",component:ge}),r.a.createElement(k.a,{path:"/quiz/:id",component:se}),r.a.createElement(k.a,{path:"/",component:we})))}}]),n}(a.Component),Ce=r.a.createElement(l.a,null,r.a.createElement(ze,null));s.a.render(Ce,document.getElementById("root"))}},[[50,1,2]]]);
//# sourceMappingURL=main.800d05e1.chunk.js.map