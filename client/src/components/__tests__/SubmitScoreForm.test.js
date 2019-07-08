import React from "react";
import chai from "chai";
import chaiEnzyme from "chai-enzyme";
import { mount, shallow, configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import SubmitScoreForm from "../SubmitScoreForm.js";
import sinon from "sinon";
chai.should();

configure({ adapter: new Adapter() });
chai.use(chaiEnzyme());

const wrapper = shallow(<SubmitScoreForm />);
const score1 = wrapper.find("#score1");
const score2 = wrapper.find("#score2");
const player1 = wrapper.find("#player1");
const player2 = wrapper.find("#player2");
const submitScoreBtn = wrapper.find("#submitScoreBtn");

describe("Rendering", () => {
  it("should render all the elements", () => {
    wrapper.exists().should.be.true;
    score1.exists().should.be.true;
    score2.exists().should.be.true;
    player1.exists().should.be.true;
    player2.exists().should.be.true;
    submitScoreBtn.exists().should.be.true;
  });
});

describe("Type value into boxes", () => {
  it("should run the relevant functions", () => {
    var score1Spy = sinon.spy(SubmitScoreForm.prototype, "setScore1");
    var player1Spy = sinon.spy(SubmitScoreForm.prototype, "setPlayer1");
    var player2Spy = sinon.spy(SubmitScoreForm.prototype, "setPlayer2");
    var score2Spy = sinon.spy(SubmitScoreForm.prototype, "setScore2");

    const eventScore1 = { target: { value: "2" } };
    const eventScore2 = { target: { value: "0" } };
    const eventPlayer1 = { target: { value: "steve" } };
    const eventPlayer2 = { target: { value: "dave" } };

    score1.simulate("change", eventScore1);
    score1Spy.calledOnce.should.be.true;

    score2.simulate("change", eventScore2);
    score2Spy.calledOnce.should.be.true;

    player1.simulate("change", eventPlayer1);
    player1Spy.calledOnce.should.be.true;

    player2.simulate("change", eventPlayer2);
    player2Spy.calledOnce.should.be.true;
  });

  describe("Type value into score boxes", () => {
    it("should update the state", () => {
      const eventScore1 = { target: { value: "2" } };
      const eventScore2 = { target: { value: "0" } };

      score1.simulate("change", eventScore1);
      score2.simulate("change", eventScore2);

      wrapper.state().score1.should.equal("2");
      wrapper.state().score2.should.equal("0");
    });
  });

  describe("Type value into player boxes", () => {
    it("should convert to uppercase and update state", () => {
      const eventPlayer1 = { target: { value: "steve" } };
      const eventPlayer2 = { target: { value: "dave" } };

      player1.simulate("change", eventPlayer1);
      player2.simulate("change", eventPlayer2);

      wrapper.state().player1.should.equal("STEVE");
      wrapper.state().player2.should.equal("DAVE");
    });
  });
});

describe("Submit Score button click", () => {
  it("should run handleSubmit()", () => {
    var spy = sinon.spy(SubmitScoreForm.prototype, "handleSubmit");
    const wrapper = shallow(<SubmitScoreForm />);
    const submitScoreBtn = wrapper.find("#submitScoreBtn");

    // prevents error with alerts. An alert showing is normal behaviour, not an error
    window.alert = () => {};

    submitScoreBtn.simulate("click");

    spy.calledOnce.should.be.true;
  });
});