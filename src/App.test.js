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
});

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});



test('renders learn react link', () => {
  render(<SciencePortalApp />);
  const linkElement = screen.getByText(/Science Portals/i);
  expect(linkElement).toBeInTheDocument();
});
