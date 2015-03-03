import pkg_resources
import requests

from urlparse import urlparse

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String
from xblock.fragment import Fragment

class SnapContextBlock(XBlock):
    """
    An XBlock providing oEmbed capabilities for video
    """

    href = String(help="URL of the video page at the provider", default=None, scope=Scope.content)
    maxwidth = Integer(help="Maximum width of the video", default=800, scope=Scope.content)
    maxheight = Integer(help="Maximum height of the video", default=450, scope=Scope.content)


    def student_view(self, context):
        """
        Create a fragment used to display the XBlock to a student.
        `context` is a dictionary used to configure the display (unused).

        Returns a `Fragment` object specifying the HTML, CSS, and JavaScript
        to display.
        """

        # This is a url from a publicly available file in Jon's Google Drive.
        # Testing (For Now)
        snap_problem_json_url = 'https://drive.google.com/uc?export=download&id=0B-WWj_i0WSomX2VmdldhcGZRYjg'

        # Actual JSON File:
        # snap_problem_json_url = "https://drive.google.com/uc?export=download&id=0B-WWj_i0WSombjZ4NEI0YU43Z2c"

        #Grab the content from the file.
        snap_problem_content = requests.get(snap_problem_json_url).content
        print("snap_problem_content")
        print(snap_problem_content)


        # Quick Test for getting the data from snapdev.
        # snap_problem_content = requests.get("http://snapdev.cs.vt.edu/api/returnTestData").content



        # Load the HTML fragment from within the package and fill in the template
        html_str = pkg_resources.resource_string(__name__, "static/html/snap_context.html")
        frag = Fragment(unicode(html_str).format(self=self, snap_problem_content=snap_problem_content))

        return frag

    def get_embed_code_for_url(self, url):
        """
        Get the code to embed from the oEmbed provider.
        """
        hostname = url and urlparse(url).hostname
        # Check that the provider is supported
        if hostname == 'vimeo.com':
            oembed_url = 'http://vimeo.com/api/oembed.json'
        else:
            return hostname, '<p>Unsupported video provider ({0})</p>'.format(hostname)

        params = {
            'url': url,
            'format': 'json',
            'maxwidth': self.maxwidth,
            'maxheight': self.maxheight,
            'api': True
        }

        try:
            r = requests.get(oembed_url, params=params)
            r.raise_for_status()
        except Exception as e:
            return hostname, '<p>Error getting video from provider ({error})</p>'.format(error=e)
        response = r.json()

        return hostname, response['html']

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("snap_context",
            """
            <vertical_demo>
                <snap_context href="https://vimeo.com/46100581" maxwidth="800" />
                <html_demo><div>Rate the video:</div></html_demo>
                <thumbs />
            </vertical_demo>
            """)
        ]

