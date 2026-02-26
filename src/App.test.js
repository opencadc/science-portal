// This file is a stub, it can be used to have automatic tests applied
// to the local instance of a basic react app. Work remains to be done
// to get it working with science portal
import { render, screen } from '@testing-library/react';
import SciencePortalApp from './App';
import { unmountComponentAtNode } from "react-dom";

let container = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  container.setAttribute("id", "react-mountpoint");
  document.body.appendChild(container);

  // Mock window.runStartupTasks used in componentDidMount
  window.runStartupTasks = jest.fn();
});

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});



test('renders Science Portal header', () => {
  render(<SciencePortalApp />);
  const headerElement = screen.getByText(/Science Portal/i);
  expect(headerElement).toBeTruthy();
});
